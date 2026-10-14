import { useEffect, useMemo, useState, type FC, type FormEvent } from "react";
import { X, ShieldAlert, ShieldCheck, Clock, Mail, History } from "lucide-react";
import {
  dhcsServices,
  getServiceById,
  type ServiceCategory,
  type Service,
} from "../../data/dhcsCodes";
import {
  useProvidersForService,
  bookSlot,
  formatSlot,
} from "../../data/providersStore";
import { useLatestPriorAuth } from "../../data/priorAuthorizationsStore";
import type { Appointment } from "../../data/appointmentsStore";
import type { Member } from "../../utils/membersUtils";

interface ScheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (appointment: Appointment) => void;
  /** Opens the full prior-authorization request form for the selected
   *  service — its required documentation, target population, and
   *  benefit limits are looked up from the CalAIM PA matrix. */
  onOpenPriorAuthForm: (service: Service) => void;
  member: Member;
  existingAppointments: { id: string }[];
  /** Pre-fills the service/provider — e.g. opening straight from a
   *  referral the consumer already accepted a provider for. */
  initialServiceId?: string;
  initialProviderId?: string;
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

const generateAppointmentId = (existing: { id: string }[]) => {
  const year = new Date().getFullYear();
  const nextNum =
    existing
      .map((a) => Number(a.id.split("-").pop()))
      .filter((n) => !Number.isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0) + 1;
  return `APT-${year}-${String(nextNum).padStart(4, "0")}`;
};


const ScheduleAppointmentModal: FC<ScheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  onOpenPriorAuthForm,
  member,
  existingAppointments,
  initialServiceId,
  initialProviderId,
}) => {
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [serviceId, setServiceId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [slot, setSlot] = useState("");

  // Pre-fill when opened for a specific service/provider (e.g. from an
  // accepted referral) instead of starting the Program picker from blank.
  useEffect(() => {
    if (!isOpen || !initialServiceId) return;
    const service = getServiceById(initialServiceId);
    if (!service) return;
    setCategory(service.category);
    setServiceId(service.id);
    if (initialProviderId) setProviderId(initialProviderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialServiceId, initialProviderId]);

  const servicesInCategory = useMemo(
    () => (category ? dhcsServices.filter((s) => s.category === category) : []),
    [category]
  );

  const selectedService = useMemo(
    () => (serviceId ? getServiceById(serviceId) : undefined),
    [serviceId]
  );

  const providers = useProvidersForService(serviceId);
  const selectedProvider = providers.find((p) => p.id === providerId);
  const latestPriorAuth = useLatestPriorAuth(member.id, serviceId);

  if (!isOpen) return null;

  const resetForm = () => {
    setCategory("");
    setServiceId("");
    setProviderId("");
    setSlot("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const requiresPriorAuth = !!selectedService?.requiresPriorAuth;
  const hasApprovedPA = requiresPriorAuth && latestPriorAuth?.status === "approved";

  const canSubmit = !!selectedService && !!selectedProvider && !!slot;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedProvider || !slot) return;

    onSchedule({
      id: generateAppointmentId(existingAppointments),
      memberId: member.id,
      member: member.name,
      serviceId: selectedService.id,
      serviceLabel: selectedService.label,
      requiresPriorAuth,
      priorAuthStatus: !requiresPriorAuth
        ? "not_required"
        : hasApprovedPA
        ? "on_file"
        : "pending",
      priorAuthNumber: hasApprovedPA ? latestPriorAuth?.number : undefined,
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      slot,
      scheduledOn: todayDisplay(),
      status: "scheduled",
    });

    bookSlot(selectedProvider.id, slot);
    resetForm();
    onClose();
  };

  const handleOpenPriorAuthForm = () => {
    if (!selectedService) return;
    onOpenPriorAuthForm(selectedService);
    handleClose();
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
            <h2 className="text-lg font-semibold text-ink-900">
              Schedule Appointment
            </h2>
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
          className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="apt-category" className={fieldLabel}>
              Program
            </label>
            <select
              id="apt-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as ServiceCategory);
                setServiceId("");
                setProviderId("");
                setSlot("");
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
            <label htmlFor="apt-service" className={fieldLabel}>
              Service type
            </label>
            <select
              id="apt-service"
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setProviderId("");
                setSlot("");
              }}
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

          {selectedService && !requiresPriorAuth && (
            <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-status-success-bg bg-status-success-bg/40 px-4 py-3">
              <ShieldCheck
                size={18}
                className="text-status-success-fg mt-0.5 shrink-0"
              />
              <p className="text-sm font-medium text-status-success-fg">
                No prior authorization required
              </p>
            </div>
          )}

          {selectedService && requiresPriorAuth && hasApprovedPA && (
            <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-status-success-bg bg-status-success-bg/40 px-4 py-3">
              <ShieldCheck
                size={18}
                className="text-status-success-fg mt-0.5 shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-status-success-fg">
                  Prior authorization on file — auto-attached
                </p>
                <p className="text-xs text-status-success-fg/80 mt-0.5">
                  {latestPriorAuth?.number} · approved{" "}
                  {latestPriorAuth?.decidedOn}. No manual entry needed.
                </p>
              </div>
            </div>
          )}

          {selectedService && requiresPriorAuth && !hasApprovedPA && (
            <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <ShieldAlert size={18} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {latestPriorAuth?.status === "requested" &&
                    `Prior authorization requested ${latestPriorAuth.requestedOn} — awaiting response from ${latestPriorAuth.healthPlan}.`}
                  {latestPriorAuth?.status === "denied" &&
                    `Prior authorization denied ${latestPriorAuth.decidedOn ?? ""}.`}
                  {!latestPriorAuth && "No prior authorization on file."}
                </p>
                {latestPriorAuth?.status === "denied" && latestPriorAuth.note && (
                  <p className="text-xs text-amber-700 mt-0.5">
                    {latestPriorAuth.note}
                  </p>
                )}
                <p className="text-xs text-amber-700 mt-1">
                  You can still schedule this appointment — it will be
                  flagged as pending prior authorization.
                </p>
                {latestPriorAuth?.status !== "requested" && (
                  <button
                    type="button"
                    onClick={handleOpenPriorAuthForm}
                    className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-600 text-xs font-medium text-white hover:bg-amber-700 transition"
                  >
                    <Mail size={14} />
                    {latestPriorAuth?.status === "denied"
                      ? "Resubmit Prior Authorization Request"
                      : "Complete Prior Authorization Request"}
                  </button>
                )}
                {latestPriorAuth?.status === "requested" && (
                  <p className="text-xs text-amber-700 mt-1 inline-flex items-center gap-1">
                    <History size={12} /> Already requested — no action
                    needed yet.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="apt-provider" className={fieldLabel}>
              Provider
            </label>
            <select
              id="apt-provider"
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setSlot("");
              }}
              required
              disabled={!serviceId}
              className={fieldControl}
            >
              <option value="">
                {serviceId ? "Select a provider" : "Pick a service type first"}
              </option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.specialty}
                </option>
              ))}
            </select>
            {serviceId && providers.length === 0 && (
              <p className="text-xs text-ink-500 leading-snug">
                No providers currently offer this service.
              </p>
            )}
          </div>

          {selectedProvider && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className={fieldLabel}>Available times</span>
              {selectedProvider.slots.length === 0 ? (
                <p className="text-sm text-ink-500">
                  No upcoming availability for {selectedProvider.name} — check
                  back later.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedProvider.slots.map((s) => {
                    const selected = slot === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlot(s)}
                        className={`flex items-center justify-center gap-1.5 h-10 px-2 rounded-lg border text-xs font-medium transition ${
                          selected
                            ? "border-brand-500 bg-brand-50 text-brand-600"
                            : "border-ink-200 text-ink-700 hover:bg-surface-muted"
                        }`}
                      >
                        <Clock size={14} />
                        {formatSlot(s)}
                      </button>
                    );
                  })}
                </div>
              )}
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
            Schedule Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleAppointmentModal;
