import { useState, type FC, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  CheckCircle,
  AlertTriangle,
  Filter,
  FileText,
  Scale,
  Plus,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import ExportInvoiceModal from "../components/ui/ExportInvoiceModal";
import { useClaims, updateClaimStatus, type Claim } from "../data/claimsStore";

type StatTone = "plain" | "active" | "submitted" | "alerts" | "appealed";
const TONES: Record<StatTone, string> = {
  plain: "bg-surface-muted text-ink-500",
  active: "bg-status-success-bg text-status-success-fg",
  submitted: "bg-accent-50 text-accent-600",
  alerts: "bg-status-danger-bg text-status-danger-fg",
  appealed: "bg-status-pending-bg text-status-pending-fg",
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

const TAB_IDS = ["All", "Submitted", "Paid", "Denied", "Appealed"] as const;
type TabId = (typeof TAB_IDS)[number];

/** Maps each tab/stat-card to the claim status it filters down to. "All"
 *  has no status of its own, so it's handled separately below. */
const TAB_STATUS: Partial<Record<TabId, Claim["status"]>> = {
  Submitted: "pending",
  Paid: "active",
  Denied: "denied",
  Appealed: "appealed",
};

/** What each internal status is called on screen (the tabs/stat cards),
 *  so searching "paid" or "denied" matches the same claims clicking that
 *  header would. */
const STATUS_SEARCH_LABEL: Record<Claim["status"], string> = {
  pending: "submitted",
  active: "paid",
  denied: "denied",
  appealed: "appealed",
};

const matchesSearch = (claim: Claim, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    claim.id.toLowerCase().includes(q) ||
    claim.member.toLowerCase().includes(q) ||
    claim.memberId.toLowerCase().includes(q) ||
    claim.service.toLowerCase().includes(q) ||
    claim.hcpcsCode.toLowerCase().includes(q) ||
    claim.serviceDate.toLowerCase().includes(q) ||
    claim.date.toLowerCase().includes(q) ||
    STATUS_SEARCH_LABEL[claim.status].includes(q)
  );
};

const Claims: FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab =
    TAB_IDS.find((t) => t === searchParams.get("tab")) ?? "All";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const claims = useClaims();
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const navigate = useNavigate();

  const paidCount = claims.filter((c) => c.status === "active").length;
  const submittedCount = claims.filter((c) => c.status === "pending").length;
  const deniedCount = claims.filter((c) => c.status === "denied").length;
  const appealedCount = claims.filter((c) => c.status === "appealed").length;

  const filteredClaims = claims
    .filter((c) => activeTab === "All" || c.status === TAB_STATUS[activeTab])
    .filter((c) => matchesSearch(c, searchQuery));

  const handleAppeal = (claim: Claim) => {
    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    updateClaimStatus(
      claim.id,
      "appealed",
      `Appealed ${today} — resubmitted for review.`
    );
    setActiveTab("Appealed");
  };

  const handleMarkPaid = (claim: Claim) => {
    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    updateClaimStatus(
      claim.id,
      "active",
      `Paid ${today} — payment received from health plan.`
    );
    setActiveTab("Paid");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            Claims Tracker
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Recorded services across all members. Bundle a member's services
            into a payer invoice with New Claim.
          </p>
        </div>
        <button
          onClick={() => setNewClaimOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition"
        >
          <Plus size={18} />
          New Claim
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Services"
          value={claims.length}
          tone="plain"
          selected={activeTab === "All"}
          onClick={() => setActiveTab("All")}
        />
        <StatCard
          label="Paid"
          value={paidCount}
          icon={CheckCircle}
          tone="active"
          selected={activeTab === "Paid"}
          onClick={() => setActiveTab("Paid")}
        />
        <StatCard
          label="Submitted"
          value={submittedCount}
          icon={FileText}
          tone="submitted"
          selected={activeTab === "Submitted"}
          onClick={() => setActiveTab("Submitted")}
        />
        <StatCard
          label="Denied"
          value={deniedCount}
          icon={AlertTriangle}
          tone="alerts"
          selected={activeTab === "Denied"}
          onClick={() => setActiveTab("Denied")}
        />
        <StatCard
          label="Appealed"
          value={appealedCount}
          icon={Scale}
          tone="appealed"
          selected={activeTab === "Appealed"}
          onClick={() => setActiveTab("Appealed")}
        />
      </div>

      <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-ink-900">Services</h2>
            <p className="text-sm text-ink-500">
              Read-only tracker — add services on a member's page
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by member, claim ID, service, date, or status..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-ink-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
              />
            </div>
            <button className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 hover:bg-surface-muted transition">
              <Filter size={16} />
              Filter by
            </button>
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

        {filteredClaims.length === 0 ? (
          <p className="text-sm text-ink-500 py-10 text-center">
            No {activeTab === "All" ? "" : activeTab.toLowerCase() + " "}claims
            {searchQuery.trim() ? ` match "${searchQuery.trim()}"` : " to show"}
            {activeTab !== "All" && !searchQuery.trim() ? " yet" : ""}.
          </p>
        ) : (
          <ul className="divide-y divide-ink-200">
            {filteredClaims.map((claim) => {
              const isExpanded = expandedId === claim.id;
              const servicePeriod =
                claim.serviceStartDate &&
                claim.serviceEndDate &&
                claim.serviceStartDate !== claim.serviceEndDate
                  ? `${claim.serviceStartDate} \u2192 ${claim.serviceEndDate}`
                  : claim.serviceStartDate ?? claim.serviceDate;

              return (
                <li key={claim.id} className="py-4">
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto] items-center gap-4">
                    <div>
                      <div className="text-sm font-semibold text-ink-900">
                        {claim.id}
                      </div>
                      <div className="text-xs text-ink-400">{claim.date}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-400">Member</div>
                      <div className="text-sm text-ink-700">{claim.member}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-ink-400">Service</div>
                      <div
                        className="text-sm text-ink-700 line-clamp-2 leading-snug"
                        title={claim.service}
                      >
                        {claim.service}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-400">Service Date</div>
                      <div className="text-sm text-ink-700">
                        {claim.serviceDate}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-400">Status</div>
                      <StatusBadge status={claim.status} />
                      {claim.notes && (
                        <div
                          className="text-xs text-ink-400 mt-0.5 line-clamp-2 leading-snug"
                          title={claim.notes}
                        >
                          {claim.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {claim.status === "denied" && (
                        <button
                          onClick={() => handleAppeal(claim)}
                          className="h-10 px-3 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition inline-flex items-center gap-1.5"
                        >
                          <Scale size={14} />
                          Appeal
                        </button>
                      )}
                      {(claim.status === "pending" ||
                        claim.status === "appealed") && (
                        <button
                          onClick={() => handleMarkPaid(claim)}
                          className="h-10 px-3 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition inline-flex items-center gap-1.5"
                        >
                          <CheckCircle size={14} />
                          Mark as Paid
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/members/${claim.memberId}`)}
                        className="h-10 px-4 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
                      >
                        View Member
                      </button>
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : claim.id)
                        }
                        aria-label={isExpanded ? "Hide details" : "Show details"}
                        aria-expanded={isExpanded}
                        className="h-10 w-10 flex items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-surface-muted transition shrink-0"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-ink-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div>
                        <div className="text-xs text-ink-400">Charge Amount</div>
                        <div className="text-sm text-ink-700">
                          {claim.chargeAmount
                            ? `$${claim.chargeAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}`
                            : "\u2014"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-ink-400">HCPCS / Modifiers</div>
                        <div className="text-sm text-ink-700">
                          {claim.hcpcsCode} {claim.modifiers.join(" ")}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-ink-400">Units</div>
                        <div className="text-sm text-ink-700">
                          {claim.units} ({claim.unit})
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-ink-400">Service Period</div>
                        <div className="text-sm text-ink-700">{servicePeriod}</div>
                      </div>
                      <div>
                        <div className="text-xs text-ink-400">Place of Service</div>
                        <div className="text-sm text-ink-700">
                          {claim.placeOfService || "\u2014"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-ink-400">Diagnosis Codes</div>
                        <div className="text-sm text-ink-700">
                          {(claim.diagnosisCodes ?? []).join(", ") || "\u2014"}
                        </div>
                      </div>
                      {claim.notes && (
                        <div className="col-span-2 sm:col-span-3 lg:col-span-6">
                          <div className="text-xs text-ink-400">Notes</div>
                          <div className="text-sm text-ink-700">{claim.notes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {newClaimOpen && (
        <ExportInvoiceModal onClose={() => setNewClaimOpen(false)} />
      )}
    </div>
  );
};

export default Claims;
