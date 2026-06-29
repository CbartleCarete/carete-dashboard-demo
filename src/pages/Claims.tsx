import { useState, type FC, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CheckCircle,
  AlertTriangle,
  Filter,
  FileText,
  Plus,
  type LucideIcon,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import ExportInvoiceModal from "../components/ui/ExportInvoiceModal";
import { useClaims } from "../data/claimsStore";

type StatTone = "plain" | "active" | "submitted" | "alerts";
const TONES: Record<StatTone, string> = {
  plain: "bg-surface-muted text-ink-500",
  active: "bg-status-success-bg text-status-success-fg",
  submitted: "bg-accent-50 text-accent-600",
  alerts: "bg-status-danger-bg text-status-danger-fg",
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone: StatTone;
};

const StatCard: FC<StatCardProps> = ({ label, value, icon: Icon, tone }) => (
  <div className="bg-white rounded-2xl border border-ink-200 p-5 flex flex-col gap-4 shadow-sm">
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
  </div>
);

const TAB_IDS = ["All", "Submitted", "Paid", "Denied", "Appealed"] as const;
type TabId = (typeof TAB_IDS)[number];

const Claims: FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("All");
  const claims = useClaims();
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const navigate = useNavigate();

  const paidCount = claims.filter((c) => c.status === "active").length;
  const submittedCount = claims.filter((c) => c.status === "pending").length;
  const deniedCount = claims.filter((c) => c.status === "denied").length;

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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Services" value={claims.length} tone="plain" />
        <StatCard
          label="Paid"
          value={paidCount}
          icon={CheckCircle}
          tone="active"
        />
        <StatCard
          label="Submitted"
          value={submittedCount}
          icon={FileText}
          tone="submitted"
        />
        <StatCard
          label="Denied"
          value={deniedCount}
          icon={AlertTriangle}
          tone="alerts"
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
                placeholder="Search by name, ID, or date birth..."
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

        <ul className="divide-y divide-ink-200">
          {claims.map((claim) => (
            <li
              key={claim.id}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto] items-center gap-4 py-4"
            >
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
                <div className="text-sm text-ink-700">{claim.serviceDate}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400">Status</div>
                <StatusBadge status={claim.status} />
              </div>
              <button
                onClick={() => navigate(`/members/${claim.memberId}`)}
                className="h-10 px-4 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
              >
                View Member
              </button>
            </li>
          ))}
        </ul>
      </div>

      {newClaimOpen && (
        <ExportInvoiceModal onClose={() => setNewClaimOpen(false)} />
      )}
    </div>
  );
};

export default Claims;
