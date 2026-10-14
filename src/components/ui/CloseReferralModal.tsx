import { useState, type FC, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  closeReferral,
  OUTCOME_TYPE_LABELS,
  type Referral,
  type ReferralOutcomeType,
} from "../../data/referralsStore";

interface CloseReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral: Referral;
}

const OUTCOME_TYPES: ReferralOutcomeType[] = [
  "completed",
  "no_show",
  "declined",
  "other",
];

const fieldLabel = "text-sm font-medium text-ink-700";
const fieldControl =
  "h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition";

const pad = (n: number) => String(n).padStart(2, "0");
const todayDisplay = () => {
  const d = new Date();
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
};

const CloseReferralModal: FC<CloseReferralModalProps> = ({
  isOpen,
  onClose,
  referral,
}) => {
  const [outcomeType, setOutcomeType] = useState<ReferralOutcomeType>("completed");
  const [outcome, setOutcome] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setOutcomeType("completed");
    setOutcome("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canSubmit = !!outcome.trim();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    closeReferral(referral.id, outcomeType, outcome.trim(), todayDisplay());
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
        className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Close Referral</h2>
            <p className="text-sm text-ink-500">{referral.serviceLabel}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-ink-500 hover:bg-surface-muted transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-ink-500">
            A referral can't be closed without a documented outcome — record
            what happened before marking this one complete.
          </p>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="close-ref-type" className={fieldLabel}>
              Outcome
            </label>
            <select
              id="close-ref-type"
              value={outcomeType}
              onChange={(e) =>
                setOutcomeType(e.target.value as ReferralOutcomeType)
              }
              className={fieldControl}
            >
              {OUTCOME_TYPES.map((t) => (
                <option key={t} value={t}>
                  {OUTCOME_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="close-ref-note" className={fieldLabel}>
              Outcome details
            </label>
            <textarea
              id="close-ref-note"
              rows={4}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="What happened with this referral?"
              required
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
            Close Referral
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloseReferralModal;
