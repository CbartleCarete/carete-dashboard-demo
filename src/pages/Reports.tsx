import { useState, type FC } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadReportPdf } from "../lib/reportPdf";
import { downloadCsv } from "../lib/csv";
import { useMembers } from "../data/membersStore";
import { useClaims } from "../data/claimsStore";
import {
  buildFinancialReport,
  buildEnrollmentReport,
  buildUtilizationReport,
  buildClaimsAnalysisReport,
  type ReportBundle,
} from "../data/reportBuilders";

const REPORTS = [
  {
    name: "Monthly Financial Report",
    description: "Detailed breakdown of reimbursements and expenses",
    formats: "PDF, CSV",
    build: buildFinancialReport,
  },
  {
    name: "Member Enrollment Report",
    description: "New enrollments, redeterminations, and conversions",
    formats: "PDF, CSV",
    build: buildEnrollmentReport,
  },
  {
    name: "Service Utilization Report",
    description: "Services delivered by type and frequency",
    formats: "PDF, CSV",
    build: buildUtilizationReport,
  },
  {
    name: "Claims Analysis Report",
    description: "Export for state reporting requirements",
    formats: "PDF, CSV",
    build: buildClaimsAnalysisReport,
  },
] satisfies { name: string; description: string; formats: string; build: () => ReportBundle }[];

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const Reports: FC = () => {
  const [generating, setGenerating] = useState<string | null>(null);
  const members = useMembers();
  const claims = useClaims();

  const activeMembers = members.filter((m) => m.status === "active").length;
  const enrollmentRate =
    members.length > 0
      ? Math.round((activeMembers / members.length) * 100)
      : 0;

  const paidClaims = claims.filter((c) => c.status === "active");
  const deniedCount = claims.filter((c) => c.status === "denied").length;
  const reimbursementTotal = paidClaims.reduce(
    (sum, c) => sum + (c.chargeAmount ?? 0),
    0
  );
  const resolvedCount = paidClaims.length + deniedCount;
  const claimsSuccessRate =
    resolvedCount > 0 ? Math.round((paidClaims.length / resolvedCount) * 100) : 0;

  const stats = [
    {
      label: "Reimbursement Summary",
      value: money(reimbursementTotal),
      detail: `Across ${paidClaims.length} paid claim${
        paidClaims.length === 1 ? "" : "s"
      }`,
    },
    {
      label: "Enrollment Rate",
      value: `${enrollmentRate}%`,
      detail: `${activeMembers} of ${members.length} members active`,
    },
    {
      label: "Services Delivered",
      value: String(claims.length),
      detail: `Across ${members.length} member${
        members.length === 1 ? "" : "s"
      }`,
    },
    {
      label: "Claims Success Rate",
      value: `${claimsSuccessRate}%`,
      detail:
        resolvedCount > 0
          ? `${paidClaims.length} paid of ${resolvedCount} resolved`
          : "No resolved claims yet",
    },
  ];

  const handleGenerate = async (
    name: string,
    build: () => ReportBundle
  ) => {
    setGenerating(name);
    try {
      const bundle = build();
      await downloadReportPdf(bundle.pdf, bundle.pdfFilename);
      downloadCsv(bundle.csvFilename, bundle.csv.headers, bundle.csv.rows);
    } finally {
      setGenerating(null);
    }
  };

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
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-ink-200 p-5 flex flex-col gap-2 shadow-sm"
          >
            <span className="text-sm text-ink-500">{s.label}</span>
            <span className="text-3xl font-semibold text-ink-900">
              {s.value}
            </span>
            <span className="text-xs font-medium text-ink-400">
              {s.detail}
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
              <button
                onClick={() => handleGenerate(report.name, report.build)}
                disabled={generating === report.name}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition shrink-0 disabled:bg-brand-500/60 disabled:cursor-not-allowed"
              >
                {generating === report.name ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {generating === report.name ? "Generating..." : "Generate"}
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
