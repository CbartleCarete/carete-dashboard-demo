import { useState, type FC, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Member } from "../../utils/membersUtils";
import { updateMember } from "../../data/membersStore";

interface Props {
  member: Member;
  onClose: () => void;
}

const fieldLabel = "text-sm font-medium text-ink-700";
const fieldControl =
  "h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition w-full";

const STATUSES: Member["status"][] = ["pending", "active", "ineligible"];

const EditMemberModal: FC<Props> = ({ member, onClose }) => {
  const [form, setForm] = useState<Member>({ ...member });

  const set = <K extends keyof Member>(key: K, value: Member[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateMember(member.id, form);
    onClose();
  };

  const text = (
    key: keyof Member,
    label: string,
    placeholder?: string
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className={fieldLabel}>{label}</label>
      <input
        className={fieldControl}
        value={(form[key] as string) ?? ""}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value as Member[keyof Member])}
      />
    </div>
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Edit Member</h2>
            <p className="text-sm text-ink-500">{member.id}</p>
          </div>
          <button
            onClick={onClose}
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
          {text("name", "Full name")}
          {text("dob", "Date of birth", "MM-DD-YYYY")}
          {text("cin", "Client ID (CIN)")}
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel}>Managed Care Plan</label>
            <input
              className={fieldControl}
              value={form.mcp}
              onChange={(e) => set("mcp", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            {text("address", "Residential address")}
          </div>
          {text("city", "City")}
          {text("zip", "ZIP")}
          <div className="flex flex-col gap-1.5">
            <label className={fieldLabel}>Status</label>
            <select
              className={fieldControl}
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as Member["status"])
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700 sm:col-span-2 mt-1">
            <input
              type="checkbox"
              checked={!!form.homeless}
              onChange={(e) => set("homeless", e.target.checked)}
              className="accent-brand-500"
            />
            Homeless indicator (Section 2 of payer form)
          </label>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-ink-200 bg-surface-muted">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-ink-200 bg-white text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="h-10 px-4 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMemberModal;
