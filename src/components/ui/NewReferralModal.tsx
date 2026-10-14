import { useEffect, useMemo, useState, type FC, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  dhcsServices,
  getServiceById,
  type ServiceCategory,
} from "../../data/dhcsCodes";
import { useProvidersForService } from "../../data/providersStore";
import type { Referral, ReferralOption } from "../../data/referralsStore";
import type { Member } from "../../utils/membersUtils";

interface NewReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (referral: Referral) => void;
  member: Member;
  existingReferrals: { id: string }[];
}

const CATEGORIES: ServiceCategory[] = [
  "ECM",
  "Community Supports",
  "Specialty Behavioral Health",
];

const fieldLabel = "text-sm font-medium text-ink-700";
const fieldControl =
  "h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition disabled:bg-surface-muted disabled:text-ink-400 disabled:cursor-not-allowed";

const pad = (n: number) => String(n).padStart(2, "0");
const todayDisplay = () => {
  const d = new Date();
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
};
const generateReferralId = (existing: { id: string }[]) => {
  const year = new Date().getFullYear();
  const existingIds = new Set(existing.map((r) => r.id));
  let nextNum =
    existing
      .map((r) => Number(r.id.split("-").pop()))
      .filter((n) => !Number.isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0) + 1;
  let id = `REF-${year}-${String(nextNum).padStart(4, "0")}`;
  // Guard against any collision — ids must be unique across every
  // member, not just this one, so a shared id never again makes one
  // referral's decision/schedule/close action affect another.
  while (existingIds.has(id)) {
    nextNum += 1;
    id = `REF-${year}-${String(nextNum).padStart(4, "0")}`;
  }
  return id;
};

const NOT_DECIDED = "__not_decided__";

const NewReferralModal: FC<NewReferralModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  member,
  existingReferrals,
}) => {
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [serviceId, setServiceId] = useState("");
  const [reason, setReason] = useState("");
  const [presentedIds, setPresentedIds] = useState<Set<string>>(new Set());
  const [decision, setDecision] = useState<string>(NOT_DECIDED);

  const servicesInCategory = useMemo(
    () => (category ? dhcsServices.filter((s) => s.category === category) : []),
    [category]
  );
  const selectedService = serviceId ? getServiceById(serviceId) : undefined;
  const providers = useProvidersForService(serviceId);

  // Default every eligible provider to "presented" whenever the service
  // changes, and reset the decision — a fresh shortlist each time.
  useEffect(() => {
    setPresentedIds(new Set(providers.map((p) => p.id)));
    setDecision(NOT_DECIDED);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  if (!isOpen) return null;

  const resetForm = () => {
    setCategory("");
    setServiceId("");
    setReason("");
    setPresentedIds(new Set());
    setDecision(NOT_DECIDED);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const togglePresented = (providerId: string) => {
    setPresentedIds((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      return next;
    });
  };

  const presentedProviders = providers.filter((p) => presentedIds.has(p.id));
  const canSubmit = !!selectedService && !!reason.trim() && presentedIds.size > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedService || !canSubmit) return;

    const optionsPresented: ReferralOption[] = presentedProviders.map((p) => ({
      providerId: p.id,
      providerName: p.name,
      specialty: p.specialty,
    }));

    const chosen =
      decision !== NOT_DECIDED
        ? presentedProviders.find((p) => p.id === decision)
        : undefined;
    const today = todayDisplay();

    const referral: Referral = {
      id: generateReferralId(existingReferrals),
      memberId: member.id,
      member: member.name,
      serviceId: selectedService.id,
      serviceLabel: selectedService.label,
      reason: reason.trim(),
      optionsPresented,
      status: chosen ? "accepted" : "pending",
      createdOn: today,
      ...(chosen
        ? {
            decidedOn: today,
            chosenProviderId: chosen.id,
            chosenProviderName: chosen.name,
          }
        : {}),
    };

    onCreate(referral);
    resetForm();
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">New Referral</h2>
            <p className="text-sm text-ink-500">
              {member.name} ({member.id})
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-ink-500 hover:bg-surface-muted transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-6 py-5 flex flex-col gap-4 overflow-y-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ref-category" className={fieldLabel}>
                Program
              </label>
              <select
                id="ref-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as ServiceCategory);
                  setServiceId("");
                }}
                required
                className={fieldControl}
              >
                <option value="">Select a program</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ref-service" className={fieldLabel}>
                Service type
              </label>
              <select
                id="ref-service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                required
                disabled={!category}
                className={fieldControl}
              >
                <option value="">
                  {category ? "Select a service" : "Pick a program first"}
                </option>
                {servicesInCategory.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ref-reason" className={fieldLabel}>
              Reason for referral
            </label>
            <textarea
              id="ref-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What screening finding or need led to this referral?"
              required
              className="px-3 py-2 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition resize-y"
            />
          </div>

          {serviceId && (
            <div className="flex flex-col gap-1.5">
              <span className={fieldLabel}>
                Options presented to the consumer
              </span>
              {providers.length === 0 ? (
                <p className="text-sm text-ink-500">
                  No providers currently offer this service.
                </p>
              ) : (
                <div className="flex flex-col gap-1 rounded-lg border border-ink-200 divide-y divide-ink-100">
                  {providers.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-ink-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={presentedIds.has(p.id)}
                        onChange={() => togglePresented(p.id)}
                        className="h-4 w-4 rounded border-ink-300"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-ink-400"> — {p.specialty}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {presentedProviders.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ref-decision" className={fieldLabel}>
                Consumer's decision (if already known)
              </label>
              <select
                id="ref-decision"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className={fieldControl}
              >
                <option value={NOT_DECIDED}>Not yet decided</option>
                {presentedProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-ink-200 bg-surface-muted">
          <button
            onClick={handleClose}
            className="h-10 px-4 rounded-lg border border-ink-200 bg-white text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-10 px-4 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition disabled:bg-brand-500/50 disabled:cursor-not-allowed"
          >
            Create Referral
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewReferralModal;
