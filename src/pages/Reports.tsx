import type { FC } from "react";
import { Download } from "lucide-react";

const REPORTS = [
  {
    name: "Monthly Financial Report",
    description: "Detailed breakdown of reimbursements and expenses",
    formats: "PDF, CSV",
  },
  {
    name: "Member Enrollment Report",
    description: "New enrollments, redeterminations, and conversions",
    formats: "PDF, CSV",
  },
  {
    name: "Service Utilization Report",
    description: "Services delivered by type and frequency",
    formats: "PDF, CSV",
  },
  {
    name: "Claims Analysis Report",
    description: "Export for state reporting requirements",
    formats: "PDF, CSV",
  },
];

const STATS = [
  { label: "Reimbursement Summary", value: "$12,450", change: "+12% from last month" },
  { label: "Enrollment Rate", value: "85%", change: "+3% from last month" },
  { label: "Services Delivered", value: "342", change: "+18% from last month" },
  { label: "Claims Success Rate", value: "92%", change: "+2% from last month" },
];

const Reports: FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Reports & Analytics
        </h1>
        <p className="text-sm text-ink-500 mt-1">
          Submit and track reimbursement claims
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-ink-200 p-5 flex flex-col gap-2 shadow-sm"
          >
            <span className="text-sm text-ink-500">{s.label}</span>
            <span className="text-3xl font-semibold text-ink-900">
              {s.value}
            </span>
            <span className="text-xs font-medium text-status-success-fg">
              {s.change}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink-900">
            Available Reports
          </h2>
          <p className="text-sm text-ink-500">Generate and download reports</p>
        </div>
        <ul className="divide-y divide-ink-200">
          {REPORTS.map((report) => (
            <li
              key={report.name}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink-900">
                  {report.name}
                </div>
                <div className="text-sm text-ink-500">{report.description}</div>
                <div className="text-xs text-ink-400 mt-1">
                  Formats: {report.formats}
                </div>
              </div>
              <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition shrink-0">
                <Download size={16} />
                Generate
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink-900">Quick Export</h2>
          <p className="text-sm text-ink-500">Export current period data</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            "Export All Claims (CSV)",
            "Export Members (CSV)",
            "Export Services (CSV)",
            "Custom Export",
          ].map((label) => (
            <button
              key={label}
              className="h-10 px-4 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
