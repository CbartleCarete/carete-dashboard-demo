import { useEffect, useMemo, useState, type FC } from "react";
import { X, Download, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import type { Member } from "../../utils/membersUtils";
import { useMembers } from "../../data/membersStore";
import { useClaims } from "../../data/claimsStore";
import { payers, getPayer } from "../../data/payers";
import { loadOrgSettings } from "../../data/orgSettings";
import { downloadInvoicePdf } from "../../lib/claimPdf";

interface Props {
  /** Preset when launched from a member page; omitted from the Claims tab. */
  member?: Member;
  onClose: () => void;
}

const fieldControl =
  "h-9 px-2 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition w-full";
const label = "text-xs font-medium text-ink-500";

const pad = (n: number) => String(n).padStart(2, "0");
const todayDisplay = () => {
  const d = new Date();
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
};
const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2 });

const ExportInvoiceModal: FC<Props> = ({ member, onClose }) => {
  const members = useMembers();
  const allClaims = useClaims();

  const [memberId, setMemberId] = useState(member?.id ?? "");
  const activeMember = members.find((m) => m.id === memberId);
  const memberClaims = useMemo(
    () => allClaims.filter((c) => c.memberId === memberId),
    [allClaims, memberId]
  );

  const [payerId, setPayerId] = useState(payers[0]?.id ?? "");
  const payer = getPayer(payerId);
  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [invoiceDate, setInvoiceDate] = useState(todayDisplay());
  const [authorizationId, setAuthorizationId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const org = useMemo(loadOrgSettings, []);
  const orgIncomplete = !org.billing.npi || !org.billing.tin;

  // Selected service ids — default to all of the current member's services.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => {
    setSelected(new Set(memberClaims.map((c) => c.id)));
  }, [memberId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedClaims = memberClaims.filter((c) => selected.has(c.id));
  const maxRows = payer?.maxServiceRows ?? 6;
  const overLimit = selectedClaims.length > maxRows;
  const missingCharge = selectedClaims.some((c) => !c.chargeAmount);
  const total = selectedClaims.reduce((s, c) => s + (c.chargeAmount ?? 0), 0);
  const diagnosisCodes = [
    ...new Set(selectedClaims.flatMap((c) => c.diagnosisCodes ?? [])),
  ];

  const handleExport = async () => {
    if (!payer || !activeMember) return;
    setError("");
    setBusy(true);
    try {
      await downloadInvoicePdf({
        payer,
        org,
        member: activeMember,
        claims: selectedClaims.slice(0, maxRows),
        meta: {
          invoiceNumber,
          invoiceDate,
          authorizationId: authorizationId || undefined,
          diagnosisCodes,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">New Claim</h2>
            <p className="text-sm text-ink-500">
              Bundle a member's services into a payer invoice
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-ink-500 hover:bg-surface-muted transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex flex-col gap-5">
          {orgIncomplete && (
            <div className="flex items-start gap-2 rounded-lg border border-status-danger-fg/30 bg-status-danger-bg px-4 py-3 text-sm text-status-danger-fg">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>
                Billing provider NPI/TIN is missing — the form will export with
                blanks. Set it in{" "}
                <Link to="/settings" className="underline font-medium">
                  Settings
                </Link>
                .
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={label}>Member</span>
              <select
                className={fieldControl}
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                disabled={!!member}
              >
                <option value="">Select a member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Payer</span>
              <select
                className={fieldControl}
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
              >
                {payers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Invoice #</span>
              <input
                className={fieldControl}
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Invoice Date</span>
              <input
                className={fieldControl}
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className={label}>Authorization ID (optional)</span>
              <input
                className={fieldControl}
                value={authorizationId}
                onChange={(e) => setAuthorizationId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-ink-900">
                Services
              </span>
              <span
                className={`text-xs ${
                  overLimit ? "text-status-danger-fg" : "text-ink-500"
                }`}
              >
                {selectedClaims.length} selected · max {maxRows} per form ·
                total ${money(total)}
              </span>
            </div>

            {!memberId ? (
              <p className="text-sm text-ink-500 py-4">
                Select a member to see their services.
              </p>
            ) : memberClaims.length === 0 ? (
              <p className="text-sm text-ink-500 py-4">
                This member has no recorded services yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-ink-200 border border-ink-200 rounded-lg">
                {memberClaims.map((c) => (
                  <li key={c.id}>
                    <label className="flex items-start gap-2 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggle(c.id)}
                        className="mt-1 accent-brand-500"
                      />
                      <span className="text-sm text-ink-700 leading-snug">
                        <span className="font-medium">{c.id}</span> · {c.service}
                        <span className="text-ink-400">
                          {" "}
                          · {c.hcpcsCode} {c.modifiers.join(" ")} · {c.units}{" "}
                          {c.unit} ·{" "}
                          {c.chargeAmount ? (
                            `$${money(c.chargeAmount)}`
                          ) : (
                            <span className="text-status-danger-fg">
                              no charge
                            </span>
                          )}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            {missingCharge && (
              <p className="text-xs text-status-danger-fg mt-2">
                Some selected services have no charge amount — set it on the
                service (Add/Edit Service) so the invoice totals correctly.
              </p>
            )}
            {diagnosisCodes.length > 0 && (
              <p className="text-xs text-ink-500 mt-2">
                Diagnosis (from services): {diagnosisCodes.join(", ")}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-status-danger-fg">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-ink-200 bg-surface-muted">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-ink-200 bg-white text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={
              busy || !memberId || selectedClaims.length === 0 || overLimit
            }
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition disabled:bg-brand-500/50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            {busy ? "Building…" : "Download Invoice PDF"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportInvoiceModal;
