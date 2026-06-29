import type { FC, ReactNode } from "react";
import {
  FileText,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";

type StatTone = "pending" | "active" | "submitted" | "alerts";

const STAT_TONES: Record<StatTone, string> = {
  pending: "bg-status-pending-bg text-status-pending-fg",
  active: "bg-status-success-bg text-status-success-fg",
  submitted: "bg-accent-50 text-accent-600",
  alerts: "bg-status-danger-bg text-status-danger-fg",
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone: StatTone;
};

const StatCard: FC<StatCardProps> = ({ label, value, icon: Icon, tone }) => (
  <div className="bg-white rounded-2xl border border-ink-200 p-5 flex flex-col gap-4 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-500">{label}</span>
      <span
        className={`h-9 w-9 rounded-full flex items-center justify-center ${STAT_TONES[tone]}`}
      >
        <Icon size={18} />
      </span>
    </div>
    <span className="text-3xl font-semibold text-ink-900">{value}</span>
  </div>
);

type QueueRow = { name: string; status: "pending" | "approved"; date: string };
const queue: QueueRow[] = [
  { name: "Maria Garcia", status: "pending", date: "11-14-2025" },
  { name: "James Wilson", status: "pending", date: "11-01-2025" },
  { name: "Sarah Chen", status: "approved", date: "10-28-2025" },
];

type ClaimRow = {
  id: string;
  status: "submitted" | "denied" | "paid";
  date: string;
};
const claims: ClaimRow[] = [
  { id: "CLM-2025-1236", status: "submitted", date: "11-14-2025" },
  { id: "CLM-2025-1235", status: "denied", date: "11-01-2025" },
  { id: "CLM-2025-1234", status: "paid", date: "10-28-2025" },
];

const cardShell = "bg-white rounded-2xl border border-ink-200 p-6 shadow-sm";
const viewAllBtn =
  "mt-4 w-full h-10 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition";

const Home: FC = () => {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500 mt-1">
          Welcome back! Here's your overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Pending Eligibility"
          value="12"
          icon={Clock}
          tone="pending"
        />
        <StatCard
          label="Active Enrollments"
          value="12"
          icon={CheckCircle}
          tone="active"
        />
        <StatCard
          label="Claims Submitted"
          value="45"
          icon={FileText}
          tone="submitted"
        />
        <StatCard
          label="Alerts"
          value="3"
          icon={AlertTriangle}
          tone="alerts"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cardShell}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-ink-900">
              Eligibility Queue
            </h2>
            <p className="text-sm text-ink-500">
              Members awaiting eligibility confirmation.
            </p>
          </div>
          <ul className="divide-y divide-ink-200">
            {queue.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-2 text-sm text-ink-700">
                  <User size={16} className="text-ink-400" />
                  <span className="font-medium">{row.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={row.status} />
                  <span className="text-xs text-ink-400">{row.date}</span>
                </div>
              </li>
            ))}
          </ul>
          <button className={viewAllBtn}>View All Pending</button>
        </div>

        <div className={cardShell}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-ink-900">
              Recent Claims
            </h2>
            <p className="text-sm text-ink-500">
              Latest claim submissions and updates
            </p>
          </div>
          <ul className="divide-y divide-ink-200">
            {claims.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-2 text-sm text-ink-700">
                  <FileText size={16} className="text-ink-400" />
                  <span className="font-medium">{row.id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={row.status} />
                  <span className="text-xs text-ink-400">{row.date}</span>
                </div>
              </li>
            ))}
          </ul>
          <button className={viewAllBtn}>View All Claims</button>
        </div>
      </div>

      <div className={cardShell}>
        <div className="flex items-start gap-3 mb-4">
          <span className="h-10 w-10 rounded-full bg-status-danger-bg text-status-danger-fg flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink-900">
              Alerts & Notifications
            </h2>
            <p className="text-sm text-ink-500">
              Important updates and action items
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-muted">
          <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-ink-700">
              15 members are approaching the redetermination deadline
            </p>
            <span className="text-xs text-ink-400">Today</span>
          </div>
          <button className="h-9 px-3 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 transition">
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
