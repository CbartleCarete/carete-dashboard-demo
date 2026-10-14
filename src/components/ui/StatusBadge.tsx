import type { FC } from "react";
import { Clock, CheckCircle, XCircle, Scale, type LucideIcon } from "lucide-react";

type StatusType =
  | "pending"
  | "approved"
  | "active"
  | "submitted"
  | "denied"
  | "paid"
  | "appealed"
  | "ineligible";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; icon: LucideIcon | null; classes: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    classes: "bg-status-pending-bg text-status-pending-fg",
  },
  submitted: {
    label: "Submitted",
    icon: Clock,
    classes: "bg-status-pending-bg text-status-pending-fg",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    classes: "bg-status-success-bg text-status-success-fg",
  },
  active: {
    label: "Active",
    icon: CheckCircle,
    classes: "bg-status-success-bg text-status-success-fg",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle,
    classes: "bg-status-success-bg text-status-success-fg",
  },
  denied: {
    label: "Denied",
    icon: XCircle,
    classes: "bg-status-danger-bg text-status-danger-fg",
  },
  appealed: {
    label: "Appealed",
    icon: Scale,
    classes: "bg-accent-50 text-accent-600",
  },
  ineligible: {
    label: "Ineligible",
    icon: XCircle,
    classes: "bg-status-danger-bg text-status-danger-fg",
  },
};

const StatusBadge: FC<StatusBadgeProps> = ({ status, label }) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}
    >
      {Icon ? <Icon size={10} /> : null}
      {label ?? cfg.label}
    </span>
  );
};

export default StatusBadge;
