// Assembles the data behind each "Generate" button on the Reports tab —
// pulled live from the member/claims stores, shaped once here into a
// {pdf, csv} bundle so Reports.tsx just has to download both.

import { getMembers } from "./membersStore";
import { getClaims, type Claim } from "./claimsStore";
import { getReferrals, OUTCOME_TYPE_LABELS, type Referral } from "./referralsStore";
import { getServiceById } from "./dhcsCodes";
import type { ReportPdfInput } from "../lib/reportPdf";

export interface ReportBundle {
  pdfFilename: string;
  csvFilename: string;
  pdf: ReportPdfInput;
  csv: { headers: string[]; rows: (string | number | undefined)[][] };
}

const pad = (n: number) => String(n).padStart(2, "0");
const todayDisplay = () => {
  const d = new Date();
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
};
const todayStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
};

const money = (n: number | undefined) =>
  `$${(n ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const CLAIM_STATUS_LABEL: Record<Claim["status"], string> = {
  pending: "Submitted",
  active: "Paid",
  denied: "Denied",
  appealed: "Appealed",
};

const MEMBER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  ineligible: "Ineligible",
};

const REFERRAL_STATUS_LABEL: Record<Referral["status"], string> = {
  pending: "Pending Decision",
  accepted: "Accepted",
  scheduled: "Scheduled",
  claimed: "Claimed",
  closed: "Closed",
};

/** "MM-DD-YYYY" -> Date (local midnight). */
const parseDisplayDate = (s: string | undefined): Date | undefined => {
  if (!s) return undefined;
  const [m, d, y] = s.split("-").map(Number);
  if (!m || !d || !y) return undefined;
  return new Date(y, m - 1, d);
};

const daysBetween = (a: Date, b: Date): number =>
  Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));

/** 1. Monthly Financial Report — reimbursements & expenses by claim status. */
export const buildFinancialReport = (): ReportBundle => {
  const claims = getClaims();
  const sumBy = (status: Claim["status"]) =>
    claims
      .filter((c) => c.status === status)
      .reduce((sum, c) => sum + (c.chargeAmount ?? 0), 0);
  const totalCharges = claims.reduce((sum, c) => sum + (c.chargeAmount ?? 0), 0);

  const rows = [...claims]
    .sort((a, b) => (a.serviceDate < b.serviceDate ? 1 : -1))
    .map((c) => [
      c.id,
      c.member,
      c.service,
      c.serviceDate,
      CLAIM_STATUS_LABEL[c.status],
      money(c.chargeAmount),
    ]);

  return {
    pdfFilename: `financial-report-${todayStamp()}.pdf`,
    csvFilename: `financial-report-${todayStamp()}.csv`,
    pdf: {
      title: "Monthly Financial Report",
      subtitle: "Detailed breakdown of reimbursements and expenses, by claim.",
      generatedOn: todayDisplay(),
      stats: [
        { label: "Total Charges", value: money(totalCharges) },
        { label: "Paid", value: money(sumBy("active")) },
        { label: "Submitted", value: money(sumBy("pending")) },
        { label: "Denied", value: money(sumBy("denied")) },
        { label: "Appealed", value: money(sumBy("appealed")) },
      ],
      columns: [
        { header: "Claim ID", width: 70 },
        { header: "Member", width: 88 },
        { header: "Service", width: 164 },
        { header: "Service Date", width: 66 },
        { header: "Status", width: 58 },
        { header: "Charge", width: 66 },
      ],
      rows,
    },
    csv: {
      headers: [
        "Claim ID",
        "Member",
        "Member ID",
        "Service",
        "Service Date",
        "Status",
        "Charge Amount",
      ],
      rows: claims.map((c) => [
        c.id,
        c.member,
        c.memberId,
        c.service,
        c.serviceDate,
        CLAIM_STATUS_LABEL[c.status],
        c.chargeAmount ?? 0,
      ]),
    },
  };
};

/** 2. Member Enrollment Report — current roster by status. */
export const buildEnrollmentReport = (): ReportBundle => {
  const members = getMembers();
  const countBy = (status: string) =>
    members.filter((m) => m.status === status).length;

  const rows = members.map((m) => [
    m.id,
    m.name,
    m.dob,
    m.mcp,
    MEMBER_STATUS_LABEL[m.status] ?? m.status,
    m.lastService,
  ]);

  return {
    pdfFilename: `member-enrollment-report-${todayStamp()}.pdf`,
    csvFilename: `member-enrollment-report-${todayStamp()}.csv`,
    pdf: {
      title: "Member Enrollment Report",
      subtitle: "New enrollments, redeterminations, and conversions.",
      generatedOn: todayDisplay(),
      stats: [
        { label: "Total Members", value: String(members.length) },
        { label: "Active", value: String(countBy("active")) },
        { label: "Pending", value: String(countBy("pending")) },
        { label: "Ineligible", value: String(countBy("ineligible")) },
      ],
      columns: [
        { header: "Member ID", width: 62 },
        { header: "Name", width: 128 },
        { header: "DOB", width: 62 },
        { header: "MCP", width: 128 },
        { header: "Status", width: 58 },
        { header: "Last Service", width: 74 },
      ],
      rows,
    },
    csv: {
      headers: ["Member ID", "Name", "DOB", "MCP", "Status", "Last Service"],
      rows: members.map((m) => [
        m.id,
        m.name,
        m.dob,
        m.mcp,
        MEMBER_STATUS_LABEL[m.status] ?? m.status,
        m.lastService,
      ]),
    },
  };
};

/** 3. Service Utilization Report — services delivered, by type & frequency. */
export const buildUtilizationReport = (): ReportBundle => {
  const claims = getClaims();

  type Group = {
    serviceId: string;
    service: string;
    hcpcsCodes: Set<string>;
    modifierSets: Set<string>;
    claimCount: number;
    totalUnits: number;
    totalCharge: number;
  };
  const groups = new Map<string, Group>();
  for (const c of claims) {
    const g =
      groups.get(c.serviceId) ??
      ({
        serviceId: c.serviceId,
        service: c.service,
        hcpcsCodes: new Set<string>(),
        modifierSets: new Set<string>(),
        claimCount: 0,
        totalUnits: 0,
        totalCharge: 0,
      } as Group);
    g.hcpcsCodes.add(c.hcpcsCode);
    g.modifierSets.add(c.modifiers.join(" "));
    g.claimCount += 1;
    g.totalUnits += c.units;
    g.totalCharge += c.chargeAmount ?? 0;
    groups.set(c.serviceId, g);
  }

  const sorted = [...groups.values()].sort((a, b) => b.claimCount - a.claimCount);
  const totalUnits = claims.reduce((sum, c) => sum + c.units, 0);
  const totalCharge = claims.reduce((sum, c) => sum + (c.chargeAmount ?? 0), 0);

  const rowsFor = (g: Group) => [
    g.service,
    g.hcpcsCodes.size === 1 ? [...g.hcpcsCodes][0] : "Multiple",
    g.modifierSets.size === 1 ? [...g.modifierSets][0] || "—" : "Multiple",
    String(g.claimCount),
    String(g.totalUnits),
    money(g.totalCharge),
  ];

  return {
    pdfFilename: `service-utilization-report-${todayStamp()}.pdf`,
    csvFilename: `service-utilization-report-${todayStamp()}.csv`,
    pdf: {
      title: "Service Utilization Report",
      subtitle: "Services delivered by type and frequency, across all members.",
      generatedOn: todayDisplay(),
      stats: [
        { label: "Services Delivered", value: String(claims.length) },
        { label: "Distinct Service Types", value: String(groups.size) },
        { label: "Total Units", value: String(totalUnits) },
        { label: "Total Charges", value: money(totalCharge) },
      ],
      columns: [
        { header: "Service", width: 216 },
        { header: "HCPCS", width: 58 },
        { header: "Modifiers", width: 68 },
        { header: "Claims", width: 56 },
        { header: "Total Units", width: 56 },
        { header: "Total Charge", width: 58 },
      ],
      rows: sorted.map(rowsFor),
    },
    csv: {
      headers: [
        "Service",
        "Service ID",
        "HCPCS",
        "Modifiers",
        "Claims",
        "Total Units",
        "Total Charge",
      ],
      rows: sorted.map((g) => [
        g.service,
        g.serviceId,
        g.hcpcsCodes.size === 1 ? [...g.hcpcsCodes][0] : "Multiple",
        g.modifierSets.size === 1 ? [...g.modifierSets][0] || "" : "Multiple",
        g.claimCount,
        g.totalUnits,
        g.totalCharge,
      ]),
    },
  };
};

/** 4. Claims Analysis Report — full claims export for state reporting. */
export const buildClaimsAnalysisReport = (): ReportBundle => {
  const claims = getClaims();
  const totalCharge = claims.reduce((sum, c) => sum + (c.chargeAmount ?? 0), 0);
  const paidCount = claims.filter((c) => c.status === "active").length;
  const deniedCount = claims.filter((c) => c.status === "denied").length;

  const rows = claims.map((c) => [
    c.id,
    c.member,
    c.service,
    `${c.hcpcsCode} ${c.modifiers.join(" ")}`.trim(),
    c.serviceDate,
    (c.diagnosisCodes ?? []).join(", ") || "—",
    CLAIM_STATUS_LABEL[c.status],
  ]);

  return {
    pdfFilename: `claims-analysis-report-${todayStamp()}.pdf`,
    csvFilename: `claims-analysis-report-${todayStamp()}.csv`,
    pdf: {
      title: "Claims Analysis Report",
      subtitle: "Full claims export for state reporting requirements.",
      generatedOn: todayDisplay(),
      stats: [
        { label: "Total Claims", value: String(claims.length) },
        { label: "Total Charges", value: money(totalCharge) },
        { label: "Paid", value: String(paidCount) },
        { label: "Denied", value: String(deniedCount) },
      ],
      columns: [
        { header: "Claim ID", width: 58 },
        { header: "Member", width: 80 },
        { header: "Service", width: 148 },
        { header: "HCPCS / Mod", width: 60 },
        { header: "Service Date", width: 58 },
        { header: "Dx Codes", width: 70 },
        { header: "Status", width: 38 },
      ],
      rows,
    },
    csv: {
      headers: [
        "Claim ID",
        "Member",
        "Member ID",
        "Service",
        "HCPCS Code",
        "Modifiers",
        "Service Date",
        "Service Start",
        "Service End",
        "Place of Service",
        "Diagnosis Codes",
        "Status",
        "Charge Amount",
      ],
      rows: claims.map((c) => [
        c.id,
        c.member,
        c.memberId,
        c.service,
        c.hcpcsCode,
        c.modifiers.join(" "),
        c.serviceDate,
        c.serviceStartDate,
        c.serviceEndDate,
        c.placeOfService,
        (c.diagnosisCodes ?? []).join(" "),
        CLAIM_STATUS_LABEL[c.status],
        c.chargeAmount ?? 0,
      ]),
    },
  };
};

/** 5. Referral Activity Report — one row per referral, with category,
 *  provider, status, outcome, and cycle time so it can be filtered or
 *  pivoted by category/provider in a spreadsheet. */
export const buildReferralActivityReport = (): ReportBundle => {
  const referrals = getReferrals();
  const today = new Date();

  const withDerived = referrals.map((r) => {
    const service = getServiceById(r.serviceId);
    const category = service?.category ?? "—";
    const createdOn = parseDisplayDate(r.createdOn);
    const closedOn = parseDisplayDate(r.closedOn);
    const daysOpen =
      createdOn && closedOn
        ? daysBetween(createdOn, closedOn)
        : createdOn
          ? daysBetween(createdOn, today)
          : undefined;
    return { r, category, daysOpen };
  });

  const totalCount = referrals.length;
  const closed = withDerived.filter((x) => x.r.status === "closed");
  const closedCount = closed.length;
  const openCount = totalCount - closedCount;
  const completedCount = closed.filter(
    (x) => x.r.outcomeType === "completed"
  ).length;
  const completionRate = closedCount
    ? `${Math.round((completedCount / closedCount) * 100)}%`
    : "—";
  const closedDurations = closed
    .map((x) => x.daysOpen)
    .filter((d): d is number => d !== undefined);
  const avgDaysToClose = closedDurations.length
    ? `${Math.round(
        closedDurations.reduce((sum, d) => sum + d, 0) / closedDurations.length
      )} days`
    : "—";

  const sorted = [...withDerived].sort((a, b) =>
    a.r.createdOn < b.r.createdOn ? 1 : -1
  );

  const pdfRows = sorted.map(({ r, category, daysOpen }) => [
    r.id,
    r.member,
    category,
    r.chosenProviderName ?? "—",
    REFERRAL_STATUS_LABEL[r.status],
    r.outcomeType ? OUTCOME_TYPE_LABELS[r.outcomeType] : "—",
    daysOpen !== undefined ? String(daysOpen) : "—",
  ]);

  return {
    pdfFilename: `referral-activity-report-${todayStamp()}.pdf`,
    csvFilename: `referral-activity-report-${todayStamp()}.csv`,
    pdf: {
      title: "Referral Activity Report",
      subtitle:
        "Referral volume and outcomes, broken out by service category and provider.",
      generatedOn: todayDisplay(),
      stats: [
        { label: "Total Referrals", value: String(totalCount) },
        { label: "Still Open", value: String(openCount) },
        { label: "Closed", value: String(closedCount) },
        { label: "Completion Rate", value: completionRate },
        { label: "Avg. Days to Close", value: avgDaysToClose },
      ],
      columns: [
        { header: "Referral ID", width: 68 },
        { header: "Member", width: 82 },
        { header: "Category", width: 86 },
        { header: "Provider", width: 114 },
        { header: "Status", width: 62 },
        { header: "Outcome", width: 62 },
        { header: "Days Open", width: 38 },
      ],
      rows: pdfRows,
    },
    csv: {
      headers: [
        "Referral ID",
        "Member",
        "Member ID",
        "Category",
        "Service",
        "Provider",
        "Status",
        "Outcome",
        "Referred On",
        "Decided On",
        "Scheduled On",
        "Claim ID",
        "Claimed On",
        "Closed On",
        "Days Open",
      ],
      rows: sorted.map(({ r, category, daysOpen }) => [
        r.id,
        r.member,
        r.memberId,
        category,
        r.serviceLabel,
        r.chosenProviderName ?? "",
        REFERRAL_STATUS_LABEL[r.status],
        r.outcomeType ? OUTCOME_TYPE_LABELS[r.outcomeType] : "",
        r.createdOn,
        r.decidedOn ?? "",
        r.scheduledOn ?? "",
        r.claimId ?? "",
        r.claimedOn ?? "",
        r.closedOn ?? "",
        daysOpen ?? "",
      ]),
    },
  };
};
