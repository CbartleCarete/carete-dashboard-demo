import { useEffect, useMemo, useState, type FC, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  dhcsServices,
  getServiceById,
  type ServiceCategory,
} from "../../data/dhcsCodes";
import type { Member } from "../../utils/membersUtils";
import type { Claim } from "../../data/claimsStore";

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddService: (claim: Claim) => void;
  /** Services are recorded against a specific member — no picker. */
  member: Member;
  existingClaims: { id: string }[];
}

const CATEGORIES: ServiceCategory[] = ["ECM", "Community Supports"];

const fieldLabel = "text-sm font-medium text-ink-700";
const fieldControl =
  "h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition disabled:bg-surface-muted disabled:text-ink-400 disabled:cursor-not-allowed";

const pad = (n: number) => String(n).padStart(2, "0");

const formatDisplayDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${m}-${d}-${y}`;
};

const todayDisplay = () => {
  const d = new Date();
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
};

const generateClaimId = (existing: { id: string }[]) => {
  const year = new Date().getFullYear();
  const nextNum =
    existing
      .map((c) => Number(c.id.split("-").pop()))
      .filter((n) => !Number.isNaN(n))
      .reduce((max, n) => Math.max(max, n), 1238) + 1;
  return `CLM-${year}-${nextNum}`;
};

const AddServiceModal: FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  onAddService,
  member,
  existingClaims,
}) => {
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [serviceId, setServiceId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceEndDate, setServiceEndDate] = useState("");
  const [units, setUnits] = useState(1);
  const [placeOfService, setPlaceOfService] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  /**
   * Whether the user has manually edited the charge field.
   * Once true, we stop auto-recomputing from `defaultRate × units` —
   * the user's number wins. Reset when the variant changes.
   */
  const [chargeOverridden, setChargeOverridden] = useState(false);
  const [notes, setNotes] = useState("");

  const servicesInCategory = useMemo(
    () => (category ? dhcsServices.filter((s) => s.category === category) : []),
    [category]
  );

  const selectedService = useMemo(
    () => (serviceId ? getServiceById(serviceId) : undefined),
    [serviceId]
  );

  const selectedVariant = useMemo(
    () => selectedService?.variants.find((v) => v.id === variantId),
    [selectedService, variantId]
  );

  // Prepopulate charge from the variant's default rate × units. Variants
  // without a defaultRate are "actual cost" pass-throughs (deposits, ALF /
  // community transitions, EAA mods) — leave the field blank so the user
  // enters the receipt amount, and surface the DHCS note below the field.
  useEffect(() => {
    if (chargeOverridden) return;
    if (selectedVariant?.defaultRate !== undefined) {
      setChargeAmount((selectedVariant.defaultRate * units).toFixed(2));
    } else {
      setChargeAmount("");
    }
  }, [selectedVariant, units, chargeOverridden]);

  if (!isOpen) return null;

  const resetForm = () => {
    setCategory("");
    setServiceId("");
    setVariantId("");
    setServiceDate("");
    setServiceEndDate("");
    setUnits(1);
    setPlaceOfService("");
    setChargeAmount("");
    setChargeOverridden(false);
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedVariant || !serviceDate) return;

    const humanLabel =
      selectedVariant.id === "default"
        ? selectedService.label
        : `${selectedService.label} — ${selectedVariant.label}`;

    onAddService({
      id: generateClaimId(existingClaims),
      date: todayDisplay(),
      memberId: member.id,
      member: member.name,
      serviceId: selectedService.id,
      variantId: selectedVariant.id,
      service: humanLabel,
      hcpcsCode: selectedVariant.hcpcsCode,
      modifiers: selectedVariant.modifiers,
      unit: selectedVariant.unit,
      units,
      serviceDate: formatDisplayDate(serviceDate),
      serviceStartDate: formatDisplayDate(serviceDate),
      serviceEndDate: formatDisplayDate(serviceEndDate || serviceDate),
      placeOfService: placeOfService.trim() || undefined,
      chargeAmount: chargeAmount ? Number(chargeAmount) : undefined,
      status: "pending",
      notes: notes.trim() || undefined,
    });

    resetForm();
    onClose();
  };

  const canSubmit = !!serviceId && !!variantId && !!serviceDate && units > 0;

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
            <h2 className="text-lg font-semibold text-ink-900">Add Service</h2>
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
            <label htmlFor="svc-category" className={fieldLabel}>
              Program
            </label>
            <select
              id="svc-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as ServiceCategory);
                setServiceId("");
                setVariantId("");
                setChargeOverridden(false);
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
            <label htmlFor="svc-service" className={fieldLabel}>
              Service
            </label>
            <select
              id="svc-service"
              value={serviceId}
              onChange={(e) => {
                const svc = getServiceById(e.target.value);
                setServiceId(e.target.value);
                // Auto-pick when a service has exactly one variant.
                setVariantId(
                  svc && svc.variants.length === 1 ? svc.variants[0].id : ""
                );
                setChargeOverridden(false);
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

          {selectedService && (
            <p className="text-xs text-ink-500 sm:col-span-2 -mt-2 leading-snug">
              {selectedService.description}
            </p>
          )}

          {selectedService && selectedService.variants.length > 1 && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="svc-variant" className={fieldLabel}>
                Type
              </label>
              <select
                id="svc-variant"
                value={variantId}
                onChange={(e) => {
                  setVariantId(e.target.value);
                  setChargeOverridden(false);
                }}
                required
                className={fieldControl}
              >
                <option value="">Select a type</option>
                {selectedService.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
              {selectedVariant?.note && (
                <p className="text-xs text-ink-500 leading-snug">
                  {selectedVariant.note}
                </p>
              )}
            </div>
          )}

          {selectedVariant && (
            <div className="sm:col-span-2 rounded-lg border border-dashed border-brand-500 bg-brand-50/40 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-600 mb-1.5">
                Will bill as
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-1 rounded border border-brand-500 text-brand-600 bg-white">
                  {selectedVariant.hcpcsCode}
                </span>
                {selectedVariant.modifiers.map((m) => (
                  <span
                    key={m}
                    className="font-mono text-xs font-semibold px-2 py-1 rounded bg-brand-500 text-white"
                  >
                    {m}
                  </span>
                ))}
                <span className="text-xs italic text-ink-500">
                  {selectedVariant.unit}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="svc-start" className={fieldLabel}>
              Service start date
            </label>
            <input
              id="svc-start"
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              required
              className={fieldControl}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="svc-end" className={fieldLabel}>
              Service end date
            </label>
            <input
              id="svc-end"
              type="date"
              value={serviceEndDate}
              onChange={(e) => setServiceEndDate(e.target.value)}
              className={fieldControl}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="svc-units" className={fieldLabel}>
              Units{selectedVariant ? ` (${selectedVariant.unit})` : ""}
            </label>
            <input
              id="svc-units"
              type="number"
              min={1}
              value={units}
              onChange={(e) => setUnits(Math.max(1, Number(e.target.value) || 1))}
              required
              className={fieldControl}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="svc-pos" className={fieldLabel}>
              Place of service
            </label>
            <input
              id="svc-pos"
              value={placeOfService}
              onChange={(e) => setPlaceOfService(e.target.value)}
              placeholder="e.g. 12 (home), 99 (other)"
              className={fieldControl}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="svc-charge" className={fieldLabel}>
              Charge amount ($)
            </label>
            <input
              id="svc-charge"
              type="number"
              min={0}
              step="0.01"
              value={chargeAmount}
              onChange={(e) => {
                setChargeAmount(e.target.value);
                setChargeOverridden(true);
              }}
              placeholder="0.00"
              className={fieldControl}
            />
            {selectedVariant?.defaultRate !== undefined && (
              <p className="text-xs text-ink-500 leading-snug">
                {chargeOverridden ? (
                  <>
                    Overridden.{" "}
                    <button
                      type="button"
                      onClick={() => setChargeOverridden(false)}
                      className="text-brand-600 hover:underline"
                    >
                      Reset to default
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-ink-700">
                      ${selectedVariant.defaultRate.toFixed(2)}
                    </span>{" "}
                    {selectedVariant.unit} × {units}
                  </>
                )}
              </p>
            )}
            {selectedVariant && selectedVariant.defaultRate === undefined && (
              <p className="text-xs text-amber-600 leading-snug">
                {selectedVariant.note ??
                  "Actual cost — enter the receipt/invoice amount."}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="svc-notes" className={fieldLabel}>
              Notes (optional)
            </label>
            <textarea
              id="svc-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context about this service"
              className="px-3 py-2 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition resize-y"
            />
          </div>
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
            Add Service
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddServiceModal;
