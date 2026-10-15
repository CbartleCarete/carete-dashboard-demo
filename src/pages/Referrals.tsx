import { useState, type FC, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Clock,
  CheckCircle,
  Calendar,
  FileText,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import {
  decideReferral,
  useReferrals,
  OUTCOME_TYPE_LABELS,
  type Referral,
} from "../data/referralsStore";
import { useClaims } from "../data/claimsStore";
import StatusBadge from "../components/ui/StatusBadge";
import CloseReferralModal from "../components/ui/CloseReferralModal";

type StatTone =
  | "plain"
  | "pending"
  | "accepted"
  | "scheduled"
  | "claimed"
  | "closed";
const TONES: Record<StatTone, string> = {
  plain: "bg-surface-muted text-ink-500",
  pending: "bg-status-pending-bg text-status-pending-fg",
  accepted: "bg-accent-50 text-accent-600",
  scheduled: "bg-brand-50 text-brand-600",
  claimed: "bg-surface-muted text-ink-500",
  closed: "bg-status-success-bg text-status-success-fg",
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone: StatTone;
  selected?: boolean;
  onClick?: () => void;
};

const StatCard: FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  tone,
  selected,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left bg-white rounded-2xl border p-5 flex flex-col gap-4 shadow-sm transition ${
      selected
        ? "border-brand-500 ring-2 ring-brand-500/20"
        : "border-ink-200 hover:border-ink-300"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-500">{label}</span>
      {Icon && (
        <span
          className={`h-9 w-9 rounded-full flex items-center justify-center ${TONES[tone]}`}
        >
          <Icon size={18} />
        </span>
      )}
    </div>
    <span className="text-3xl font-semibold text-ink-900">{value}</span>
  </button>
);

const TAB_IDS = [
  "All",
  "Pending",
  "Accepted",
  "Scheduled",
  "Claimed",
  "Closed",
] as const;
type TabId = (typeof TAB_IDS)[number];

/** Maps each tab/stat-card to the referral status it filters down to.
 *  "All" has no status of its own, so it's handled separately below. */
const TAB_STATUS: Partial<Record<TabId, Referral["status"]>> = {
  Pending: "pending",
  Accepted: "accepted",
  Scheduled: "scheduled",
  Claimed: "claimed",
  Closed: "closed",
};

const REFERRAL_STATUS_STYLES: Record<Referral["status"], string> = {
  pending: "bg-status-pending-bg text-status-pending-fg",
  accepted: "bg-accent-50 text-accent-600",
  scheduled: "bg-brand-50 text-brand-600",
  claimed: "bg-surface-muted text-ink-500",
  closed: "bg-status-success-bg text-status-success-fg",
};

const REFERRAL_STATUS_LABEL: Record<Referral["status"], string> = {
  pending: "Pending Decision",
  accepted: "Accepted",
  scheduled: "Scheduled",
  claimed: "Claimed",
  closed: "Closed",
};

const pad = (n: number) => String(n).padStart(2, "0");
const todayDisplay = () => {
  const d = new Date();
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
};

const matchesSearch = (referral: Referral, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    referral.id.toLowerCase().includes(q) ||
    referral.member.toLowerCase().includes(q) ||
    referral.memberId.toLowerCase().includes(q) ||
    referral.serviceLabel.toLowerCase().includes(q) ||
    referral.reason.toLowerCase().includes(q) ||
    referral.createdOn.toLowerCase().includes(q) ||
    REFERRAL_STATUS_LABEL[referral.status].toLowerCase().includes(q) ||
    referral.optionsPresented.some((o) =>
      o.providerName.toLowerCase().includes(q)
    ) ||
    (referral.chosenProviderName ?? "").toLowerCase().includes(q)
  );
};

const Referrals: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab =
    TAB_IDS.find((t) => t === searchParams.get("tab")) ?? "All";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [closingReferral, setClosingReferral] = useState<Referral | null>(
    null
  );
  const referrals = useReferrals();
  const claims = useClaims();

  const pendingCount = referrals.filter((r) => r.status === "pending").length;
  const acceptedCount = referrals.filter((r) => r.status === "accepted").length;
  const scheduledCount = referrals.filter(
    (r) => r.status === "scheduled"
  ).length;
  const claimedCount = referrals.filter((r) => r.status === "claimed").length;
  const closedCount = referrals.filter((r) => r.status === "closed").length;

  const filteredReferrals = referrals
    .filter((r) => activeTab === "All" || r.status === TAB_STATUS[activeTab])
    .filter((r) => matchesSearch(r, searchQuery));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Referrals</h1>
        <p className="text-sm text-ink-500 mt-1">
          Referrals to outside services, across all members — from
          screening finding to closed outcome.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Referrals"
          value={referrals.length}
          icon={UserPlus}
          tone="plain"
          selected={activeTab === "All"}
          onClick={() => setActiveTab("All")}
        />
        <StatCard
          label="Pending Decision"
          value={pendingCount}
          icon={Clock}
          tone="pending"
          selected={activeTab === "Pending"}
          onClick={() => setActiveTab("Pending")}
        />
        <StatCard
          label="Accepted"
          value={acceptedCount}
          icon={CheckCircle}
          tone="accepted"
          selected={activeTab === "Accepted"}
          onClick={() => setActiveTab("Accepted")}
        />
        <StatCard
          label="Scheduled"
          value={scheduledCount}
          icon={Calendar}
          tone="scheduled"
          selected={activeTab === "Scheduled"}
          onClick={() => setActiveTab("Scheduled")}
        />
        <StatCard
          label="Claimed"
          value={claimedCount}
          icon={FileText}
          tone="claimed"
          selected={activeTab === "Claimed"}
          onClick={() => setActiveTab("Claimed")}
        />
        <StatCard
          label="Closed"
          value={closedCount}
          icon={FileText}
          tone="closed"
          selected={activeTab === "Closed"}
          onClick={() => setActiveTab("Closed")}
        />
      </div>

      <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-ink-900">
              All Referrals
            </h2>
            <p className="text-sm text-ink-500">
              Start a new referral from the member's page
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by member, referral ID, service, provider, or status..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-ink-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
            />
          </div>
        </div>

        <div className="flex gap-1 border-b border-ink-200 mb-4 overflow-x-auto">
          {TAB_IDS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 whitespace-nowrap transition ${
                activeTab === tab
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-ink-500 hover:text-ink-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {filteredReferrals.length === 0 ? (
          <p className="text-sm text-ink-500 py-10 text-center">
            No {activeTab === "All" ? "" : activeTab.toLowerCase() + " "}
            referrals
            {searchQuery.trim() ? ` match "${searchQuery.trim()}"` : " to show"}
            {activeTab !== "All" && !searchQuery.trim() ? " yet" : ""}.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-ink-200">
            {filteredReferrals.map((r) => (
              <li key={r.id} className="py-4 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink-900">
                      {r.serviceLabel}
                    </div>
                    <div className="text-xs text-ink-400">
                      {r.id} · Referred {r.createdOn}
                    </div>
                    <div className="text-sm text-ink-700 mt-1">
                      {r.member}{" "}
                      <span className="text-ink-400">({r.memberId})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium whitespace-nowrap ${REFERRAL_STATUS_STYLES[r.status]}`}
                    >
                      {REFERRAL_STATUS_LABEL[r.status]}
                    </span>
                    <button
                      onClick={() =>
                        navigate(`/members/${r.memberId}?tab=referrals`)
                      }
                      className="h-9 px-3 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition whitespace-nowrap"
                    >
                      View Member
                    </button>
                  </div>
                </div>

                <p className="text-sm text-ink-700">{r.reason}</p>

                <div className="text-xs text-ink-500">
                  Options presented:{" "}
                  {r.optionsPresented.map((o) => o.providerName).join(", ")}
                </div>

                {r.status === "pending" && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {r.optionsPresented.map((o) => (
                      <button
                        key={o.providerId}
                        onClick={() =>
                          decideReferral(r.id, todayDisplay(), {
                            providerId: o.providerId,
                            providerName: o.providerName,
                          })
                        }
                        className="h-8 px-3 rounded-lg border border-ink-200 text-xs font-medium text-ink-700 hover:bg-surface-muted transition"
                      >
                        Consumer chose {o.providerName}
                      </button>
                    ))}
                    <button
                      onClick={() => decideReferral(r.id, todayDisplay(), null)}
                      className="h-8 px-3 rounded-lg border border-ink-200 text-xs font-medium text-ink-500 hover:bg-surface-muted transition"
                    >
                      Decline all options
                    </button>
                  </div>
                )}

                {r.status === "accepted" && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-ink-500">
                      Consumer selected {r.chosenProviderName} on{" "}
                      {r.decidedOn}.
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/members/${r.memberId}?tab=referrals`)
                      }
                      className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-brand-500 text-xs font-medium text-white hover:bg-brand-600 transition"
                    >
                      <Calendar size={14} />
                      Schedule Appointment
                    </button>
                  </div>
                )}

                {r.status === "scheduled" && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-ink-500">
                      Scheduled with {r.chosenProviderName} on {r.scheduledOn}
                      {r.appointmentId
                        ? ` · Appointment ${r.appointmentId}`
                        : ""}
                      .
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          navigate(`/members/${r.memberId}?tab=referrals`)
                        }
                        className="h-8 px-3 rounded-lg bg-brand-500 text-xs font-medium text-white hover:bg-brand-600 transition"
                      >
                        Create Claim
                      </button>
                      <button
                        onClick={() => setClosingReferral(r)}
                        className="h-8 px-3 rounded-lg border border-ink-200 text-xs font-medium text-ink-700 hover:bg-surface-muted transition"
                      >
                        Close Referral
                      </button>
                    </div>
                  </div>
                )}

                {r.status === "claimed" && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-xs text-ink-500">
                      <p>
                        Claimed on {r.claimedOn}
                        {r.claimId ? ` · Claim ${r.claimId}` : ""}.
                      </p>
                      {(() => {
                        const linkedClaim = claims.find(
                          (c) => c.id === r.claimId
                        );
                        return linkedClaim ? (
                          <div className="mt-1 flex items-center gap-2">
                            <span>Claim status:</span>
                            <StatusBadge status={linkedClaim.status} />
                          </div>
                        ) : null;
                      })()}
                      <p className="mt-1">
                        Closes automatically once that claim is paid — close
                        manually instead if it won&apos;t be (e.g. denied).
                      </p>
                    </div>
                    <button
                      onClick={() => setClosingReferral(r)}
                      className="h-8 px-3 rounded-lg border border-ink-200 text-xs font-medium text-ink-700 hover:bg-surface-muted transition"
                    >
                      Close Manually
                    </button>
                  </div>
                )}

                {r.status === "closed" && (
                  <p className="text-xs text-ink-500">
                    {r.outcomeType
                      ? OUTCOME_TYPE_LABELS[r.outcomeType]
                      : "Closed"}
                    {r.closedOn ? ` on ${r.closedOn}` : ""}
                    {r.outcome ? ` — ${r.outcome}` : ""}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {closingReferral && (
        <CloseReferralModal
          isOpen={!!closingReferral}
          referral={closingReferral}
          onClose={() => setClosingReferral(null)}
        />
      )}
    </div>
  );
};

export default Referrals;
