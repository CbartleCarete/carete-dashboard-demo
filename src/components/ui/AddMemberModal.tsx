import { useRef, type FC, type FormEvent } from "react";
import { X } from "lucide-react";
import { formatMemberData, type Member } from "../../utils/membersUtils";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (member: Member) => void;
}

const fieldLabel = "text-sm font-medium text-ink-700";
const fieldControl =
  "h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition";

const AddMemberModal: FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const rawData = {
      name: formData.get("member-name") as string,
      id: formData.get("member-id") as string,
      dob: formData.get("member-dob") as string,
      mcp: formData.get("member-mcp") as string,
      lastService: formData.get("last-service-date") as string,
      status: formData.get("member-status") as string,
    };

    const newMember = formatMemberData(rawData);
    onAddMember(newMember);
    formRef.current.reset();
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
          <h2 className="text-lg font-semibold text-ink-900">Add New Member</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-ink-500 hover:bg-surface-muted transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="member-name" className={fieldLabel}>
              Full Name
            </label>
            <input
              id="member-name"
              name="member-name"
              type="text"
              required
              placeholder="Enter member's full name"
              className={fieldControl}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="member-dob" className={fieldLabel}>
              Date of Birth
            </label>
            <input
              id="member-dob"
              name="member-dob"
              type="date"
              required
              className={fieldControl}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="member-mcp" className={fieldLabel}>
              MCP
            </label>
            <select
              id="member-mcp"
              name="member-mcp"
              required
              className={fieldControl}
            >
              <option value="">Select MCP</option>
              <option value="LA Care">LA Care</option>
              <option value="Health Net">Health Net</option>
              <option value="Blue Shield Promise">Blue Shield Promise</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="member-id" className={fieldLabel}>
              Member ID
            </label>
            <input
              id="member-id"
              name="member-id"
              type="text"
              required
              placeholder="Enter member ID"
              className={fieldControl}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="last-service-date" className={fieldLabel}>
              Date of Last Service
            </label>
            <input
              id="last-service-date"
              name="last-service-date"
              type="date"
              className={fieldControl}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="member-status" className={fieldLabel}>
              Eligibility Status
            </label>
            <select
              id="member-status"
              name="member-status"
              required
              className={fieldControl}
            >
              <option value="">Select Eligibility Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="ineligible">Ineligible</option>
            </select>
          </div>
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
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
