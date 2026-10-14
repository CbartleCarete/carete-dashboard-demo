import { useState, type FC, type FormEvent } from "react";
import { X, Mail, MessageSquare, Phone, FileText } from "lucide-react";
import type { Member } from "../../utils/membersUtils";
import {
  RECIPIENT_LABELS,
  CHANNEL_LABELS,
  type Message,
  type MessageRecipient,
  type MessageChannel,
} from "../../data/messagesStore";

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: Message) => void;
  member: Member;
  existingMessages: { id: string }[];
  /** Optional pre-filled starting values (e.g. a drafted PA request). */
  initialRecipient?: MessageRecipient;
  initialChannel?: MessageChannel;
  initialSubject?: string;
  initialBody?: string;
}

const RECIPIENTS: MessageRecipient[] = [
  "member",
  "care_team",
  "provider",
  "health_plan",
];

const CHANNELS: { id: MessageChannel; icon: typeof Mail }[] = [
  { id: "email", icon: Mail },
  { id: "text", icon: MessageSquare },
  { id: "call", icon: Phone },
  { id: "letter", icon: FileText },
];

const fieldLabel = "text-sm font-medium text-ink-700";
const fieldControl =
  "h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition";

const pad = (n: number) => String(n).padStart(2, "0");

const todayDisplay = () => {
  const d = new Date();
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
};

const generateMessageId = (existing: { id: string }[]) => {
  const year = new Date().getFullYear();
  const nextNum =
    existing
      .map((m) => Number(m.id.split("-").pop()))
      .filter((n) => !Number.isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0) + 1;
  return `MSG-${year}-${String(nextNum).padStart(4, "0")}`;
};

const SendMessageModal: FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  onSend,
  member,
  existingMessages,
  initialRecipient,
  initialChannel,
  initialSubject,
  initialBody,
}) => {
  const [recipient, setRecipient] = useState<MessageRecipient | "">(
    initialRecipient ?? ""
  );
  const [channel, setChannel] = useState<MessageChannel | "">(
    initialChannel ?? ""
  );
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [body, setBody] = useState(initialBody ?? "");

  if (!isOpen) return null;

  const resetForm = () => {
    setRecipient("");
    setChannel("");
    setSubject("");
    setBody("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!recipient || !channel || !body.trim()) return;

    onSend({
      id: generateMessageId(existingMessages),
      memberId: member.id,
      member: member.name,
      recipient,
      channel,
      subject: subject.trim() || undefined,
      body: body.trim(),
      sentAt: todayDisplay(),
      status: "sent",
    });

    resetForm();
    onClose();
  };

  const showsSubject = channel === "email" || channel === "letter";
  const bodyLabel = channel === "call" ? "Call notes / talking points" : "Message";

  const canSubmit = !!recipient && !!channel && !!body.trim();

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
            <h2 className="text-lg font-semibold text-ink-900">Send Message</h2>
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
            <label htmlFor="msg-recipient" className={fieldLabel}>
              Send to
            </label>
            <select
              id="msg-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value as MessageRecipient)}
              required
              className={fieldControl}
            >
              <option value="">Select a recipient</option>
              {RECIPIENTS.map((r) => (
                <option key={r} value={r}>
                  {RECIPIENT_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={fieldLabel}>Channel</span>
            <div className="grid grid-cols-4 gap-2">
              {CHANNELS.map(({ id, icon: Icon }) => {
                const selected = channel === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setChannel(id)}
                    className={`flex flex-col items-center justify-center gap-1 h-16 rounded-lg border text-xs font-medium transition ${
                      selected
                        ? "border-brand-500 bg-brand-50 text-brand-600"
                        : "border-ink-200 text-ink-500 hover:bg-surface-muted"
                    }`}
                  >
                    <Icon size={18} />
                    {CHANNEL_LABELS[id]}
                  </button>
                );
              })}
            </div>
          </div>

          {showsSubject && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="msg-subject" className={fieldLabel}>
                Subject (optional)
              </label>
              <input
                id="msg-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Upcoming appointment reminder"
                className={fieldControl}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="msg-body" className={fieldLabel}>
              {bodyLabel}
            </label>
            <textarea
              id="msg-body"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                channel === "call"
                  ? "What to cover on the call"
                  : "Write your message"
              }
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
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendMessageModal;
