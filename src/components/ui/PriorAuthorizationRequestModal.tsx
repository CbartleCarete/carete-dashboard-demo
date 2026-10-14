import { useMemo, useState, type FC, type FormEvent } from "react";
import { X, AlertTriangle, Info } from "lucide-react";
import type { Member } from "../../utils/membersUtils";
import type { Service } from "../../data/dhcsCodes";
import { getPARequirement } from "../../data/paRequirements";
import { loadOrgSettings, effectiveRendering } from "../../data/orgSettings";
import {
  addPriorAuth,
  usePriorAuths,
  type HousingDepositDetails,
  type PriorAuthorization,
} from "../../data/priorAuthorizationsStore";
import {
  downloadPriorAuthPdf,
  type PriorAuthPdfSection,
} from "../../lib/priorAuthPdf";

interface PriorAuthorizationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  service: Service;
  /** Hands the parent a drafted subject/body so it can open "Send
   *  Message" to the health plan pre-filled with this request. */
  onSubmitted: (args: { subject: string; body: string }) => void;
}

const DIAGNOSIS_PRESETS: { code: string; label: string }[] = [
  { code: "Z59.0", label: "Homelessness" },
  { code: "Z59.1", label: "Inadequate housing" },
];

const AMOUNT_THRESHOLD = 5000;
const isHousingDeposit = (service: Service) => service.id === "housing-deposits";

const fieldLabel = "text-sm font-medium text-ink-700";
const fieldControl =
  "h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition w-full";
const sectionHeading =
  "sm:col-span-2 text-sm font-semibold text-ink-900 border-t border-ink-200 pt-4 first:border-t-0 first:pt-0";
const readOnlyPanel =
  "sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 rounded-lg bg-surface-muted px-4 py-3 text-sm text-ink-700";

const pad = (n: number) => String(n).padStart(2, "0");
const todayDisplay = () => {
  const d = new Date();
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
};
const generatePriorAuthId = (existing: { id: string }[]) => {
  const year = new Date().getFullYear();
  const nextNum =
    existing
      .map((p) => Number(p.id.split("-").pop()))
      .filter((n) => !Number.isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0) + 1;
  return `PA-${year}-${String(nextNum).padStart(4, "0")}`;
};
const money = (n: number | undefined) => (n ?? 0).toLocaleString("en-US");

const PriorAuthorizationRequestModal: FC<PriorAuthorizationRequestModalProps> = ({
  isOpen,
  onClose,
  member,
  service,
  onSubmitted,
}) => {
  const existingPriorAuths = usePriorAuths();
  const provider = useMemo(() => effectiveRendering(loadOrgSettings()), []);
  const req = getPARequirement(service.id);
  const housingDeposit = isHousingDeposit(service);

  const [requestedStartDate, setRequestedStartDate] = useState("");
  const [serviceEndDate, setServiceEndDate] = useState("");
  const [diagnosisCodes, setDiagnosisCodes] = useState<string[]>([]);
  const [customDx, setCustomDx] = useState("");
  const [requestedUnitsOrAmount, setRequestedUnitsOrAmount] = useState("");
  const [confirmedFields, setConfirmedFields] = useState<string[]>([]);
  const [lifetimeDuplicationAttested, setLifetimeDuplicationAttested] =
    useState(false);

  // Housing Deposits-only fields (itemized breakdown, landlord, payee).
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [utilityFees, setUtilityFees] = useState("");
  const [firstMonthRent, setFirstMonthRent] = useState("");
  const [moveInGoods, setMoveInGoods] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [landlordAddress, setLandlordAddress] = useState("");
  const [leaseStartDate, setLeaseStartDate] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [w9OnFile, setW9OnFile] = useState(false);
  const [remitTo, setRemitTo] = useState<"landlord" | "vendor" | "other">(
    "landlord"
  );
  const [mailingOrEftAddress, setMailingOrEftAddress] = useState("");
  const [priorDepositReceived, setPriorDepositReceived] = useState<
    "no" | "yes" | ""
  >("");
  const [exceptionNote, setExceptionNote] = useState("");

  if (!isOpen) return null;

  const addressLine = [member.address, member.city, member.zip]
    .filter(Boolean)
    .join(", ");

  const itemizedSum =
    (Number(securityDeposit) || 0) +
    (Number(utilityFees) || 0) +
    (Number(firstMonthRent) || 0) +
    (Number(moveInGoods) || 0);
  const requestedAmountNum = housingDeposit
    ? Number(requestedUnitsOrAmount) || 0
    : 0;
  const overThreshold = housingDeposit && requestedAmountNum > AMOUNT_THRESHOLD;
  const amountMismatch =
    housingDeposit &&
    itemizedSum > 0 &&
    requestedAmountNum > 0 &&
    itemizedSum !== requestedAmountNum;

  const toggleDx = (code: string) =>
    setDiagnosisCodes((codes) =>
      codes.includes(code) ? codes.filter((c) => c !== code) : [...codes, code]
    );
  const addCustomDx = () => {
    const code = customDx.trim().toUpperCase();
    if (code && !diagnosisCodes.includes(code)) {
      setDiagnosisCodes((codes) => [...codes, code]);
    }
    setCustomDx("");
  };
  const toggleField = (field: string) =>
    setConfirmedFields((fields) =>
      fields.includes(field)
        ? fields.filter((f) => f !== field)
        : [...fields, field]
    );

  const resetForm = () => {
    setRequestedStartDate("");
    setServiceEndDate("");
    setDiagnosisCodes([]);
    setCustomDx("");
    setRequestedUnitsOrAmount("");
    setConfirmedFields([]);
    setLifetimeDuplicationAttested(false);
    setSecurityDeposit("");
    setUtilityFees("");
    setFirstMonthRent("");
    setMoveInGoods("");
    setLandlordName("");
    setLandlordPhone("");
    setLandlordAddress("");
    setLeaseStartDate("");
    setPayeeName("");
    setW9OnFile(false);
    setRemitTo("landlord");
    setMailingOrEftAddress("");
    setPriorDepositReceived("");
    setExceptionNote("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canSubmit =
    !!requestedStartDate &&
    diagnosisCodes.length > 0 &&
    !!requestedUnitsOrAmount.trim() &&
    (!housingDeposit ||
      (requestedAmountNum > 0 &&
        !!landlordName.trim() &&
        !!leaseStartDate &&
        !!payeeName.trim() &&
        priorDepositReceived !== "" &&
        (priorDepositReceived === "no" || !!exceptionNote.trim())));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    let details: HousingDepositDetails | undefined;
    if (housingDeposit) {
      details = {
        requestedStartDate,
        serviceEndDate: serviceEndDate || undefined,
        diagnosisCodes,
        requestedAmount: requestedAmountNum,
        expenses: {
          securityDeposit: securityDeposit ? Number(securityDeposit) : undefined,
          utilityConnectionFees: utilityFees ? Number(utilityFees) : undefined,
          firstMonthRent: firstMonthRent ? Number(firstMonthRent) : undefined,
          moveInGoods: moveInGoods ? Number(moveInGoods) : undefined,
        },
        landlord: {
          name: landlordName.trim(),
          phone: landlordPhone.trim() || undefined,
          address: landlordAddress.trim() || undefined,
        },
        leaseStartDate,
        payee: {
          name: payeeName.trim(),
          w9OnFile,
          remitTo,
          mailingOrEftAddress: mailingOrEftAddress.trim() || undefined,
        },
        attestation: {
          linkedToHousingServices: lifetimeDuplicationAttested,
          priorDepositReceived: priorDepositReceived || "no",
          exceptionNote: exceptionNote.trim() || undefined,
        },
      };
    }

    const record: PriorAuthorization = {
      id: generatePriorAuthId(existingPriorAuths),
      memberId: member.id,
      member: member.name,
      serviceId: service.id,
      serviceLabel: service.label,
      healthPlan: member.mcp,
      status: "requested",
      requestedOn: todayDisplay(),
      requestedUnitsOrAmount,
      documentationConfirmed: confirmedFields,
      lifetimeDuplicationAttested,
      housingDeposit: details,
    };
    addPriorAuth(record);

    const paCode = req?.paCode
      ? `${req.paCode.hcpcs} / ${req.paCode.modifier}`
      : "—";

    const bodyLines = [
      `PRIOR AUTHORIZATION REQUEST — ${service.label.toUpperCase()}`,
      "",
      "1. MEMBER INFORMATION",
      `Name: ${member.name}`,
      `DOB: ${member.dob}`,
      `Medicaid CIN: ${member.cin || "—"}`,
      `Health Plan Member ID: ${member.healthPlanMemberId || "—"}`,
      `Health Plan: ${member.mcp}`,
      `Phone: ${member.phone || "—"}`,
      `Address: ${addressLine || "—"}`,
      `Living Situation: ${
        member.homeless ? "Experiencing homelessness" : "Stably housed"
      }`,
      "",
      "2. REFERRING / REQUESTING PROVIDER",
      `Organization: ${provider.orgName || "—"}`,
      `NPI: ${provider.npi || "—"}`,
      `TIN: ${provider.tin || "—"}`,
      `Address: ${[provider.address, provider.city, provider.zip]
        .filter(Boolean)
        .join(", ") || "—"}`,
      `Phone: ${provider.phone || "—"}`,
      "",
      "3. SERVICE & CLINICAL DETAILS",
      `Procedure (PA code): ${paCode} — ${service.label}`,
      `Target Population: ${req?.targetPopulation || "—"}`,
      `Requested Start Date: ${requestedStartDate}`,
      `Service End Date: ${serviceEndDate || "—"}`,
      `Diagnosis Code(s): ${diagnosisCodes.join(", ")}`,
      `Requested Units / Frequency / Duration / Amount: ${requestedUnitsOrAmount}${
        overThreshold ? " (exceeds $5,000 — may require additional approval)" : ""
      }`,
      "",
      "4. REQUIRED DOCUMENTATION",
      ...(req?.requiredFields ?? []).map(
        (f) => `[${confirmedFields.includes(f) ? "x" : " "}] ${f}`
      ),
      "",
      `Benefit Limits: ${req?.limits || "—"}`,
      `MCP Notes: ${req?.mcpNotes || "—"}`,
      "",
      "5. ATTESTATION",
      `Does not duplicate an existing State Plan benefit and respects lifetime/frequency limits: ${
        lifetimeDuplicationAttested ? "Yes" : "No"
      }`,
    ];

    if (housingDeposit) {
      bodyLines.push(
        "",
        "6. HOUSING DEPOSIT — ITEMIZED BREAKDOWN",
        `Security deposit: $${money(Number(securityDeposit) || 0)}`,
        `Utility connection fees: $${money(Number(utilityFees) || 0)}`,
        `First month's rent: $${money(Number(firstMonthRent) || 0)}`,
        `Move-in goods / essentials: $${money(Number(moveInGoods) || 0)}`,
        `Total itemized: $${money(itemizedSum)}`,
        "",
        `Landlord / Property: ${landlordName}${
          landlordPhone ? `, ${landlordPhone}` : ""
        }${landlordAddress ? `, ${landlordAddress}` : ""}`,
        `Lease Start / Move-in Date: ${leaseStartDate}`,
        "",
        `Payee: ${payeeName}`,
        `W-9 on file: ${w9OnFile ? "Yes" : "No"}`,
        `Remit to: ${remitTo}`,
        `Mailing / EFT Address: ${mailingOrEftAddress || "—"}`,
        `Previously received a housing deposit benefit: ${
          priorDepositReceived === "yes" ? "Yes" : "No"
        }${
          priorDepositReceived === "yes" && exceptionNote
            ? ` — exception: ${exceptionNote}`
            : ""
        }`
      );
    }

    const pdfSections: PriorAuthPdfSection[] = [
      {
        heading: "1. MEMBER INFORMATION",
        rows: [
          `Name: ${member.name}`,
          `DOB: ${member.dob}`,
          `Medicaid CIN: ${member.cin || "—"}`,
          `Health Plan Member ID: ${member.healthPlanMemberId || "—"}`,
          `Health Plan: ${member.mcp}`,
          `Phone: ${member.phone || "—"}`,
          `Address: ${addressLine || "—"}`,
          `Living Situation: ${
            member.homeless ? "Experiencing homelessness" : "Stably housed"
          }`,
        ],
      },
      {
        heading: "2. REFERRING / REQUESTING PROVIDER",
        rows: [
          `Organization: ${provider.orgName || "—"}`,
          `NPI: ${provider.npi || "—"}`,
          `TIN: ${provider.tin || "—"}`,
          `Address: ${
            [provider.address, provider.city, provider.zip]
              .filter(Boolean)
              .join(", ") || "—"
          }`,
          `Phone: ${provider.phone || "—"}`,
        ],
      },
      {
        heading: "3. SERVICE & CLINICAL DETAILS",
        rows: [
          `Procedure (PA code): ${paCode} — ${service.label}`,
          `Target Population: ${req?.targetPopulation || "—"}`,
          `Requested Start Date: ${requestedStartDate}`,
          `Service End Date: ${serviceEndDate || "—"}`,
          `Diagnosis Code(s): ${diagnosisCodes.join(", ")}`,
          `Requested Units / Frequency / Duration / Amount: ${requestedUnitsOrAmount}${
            overThreshold
              ? " (exceeds $5,000 — may require additional approval)"
              : ""
          }`,
        ],
      },
      {
        heading: "4. REQUIRED DOCUMENTATION",
        checklist: (req?.requiredFields ?? []).map((f) => ({
          text: f,
          checked: confirmedFields.includes(f),
        })),
        rows: [
          `Benefit Limits: ${req?.limits || "—"}`,
          `MCP Notes: ${req?.mcpNotes || "—"}`,
        ],
      },
      {
        heading: "5. ATTESTATION",
        rows: [
          `Does not duplicate an existing State Plan benefit and respects lifetime/frequency limits: ${
            lifetimeDuplicationAttested ? "Yes" : "No"
          }`,
        ],
      },
    ];

    if (housingDeposit) {
      pdfSections.push({
        heading: "6. HOUSING DEPOSIT — ITEMIZED BREAKDOWN",
        rows: [
          `Security deposit: $${money(Number(securityDeposit) || 0)}`,
          `Utility connection fees: $${money(Number(utilityFees) || 0)}`,
          `First month's rent: $${money(Number(firstMonthRent) || 0)}`,
          `Move-in goods / essentials: $${money(Number(moveInGoods) || 0)}`,
          `Total itemized: $${money(itemizedSum)}`,
          `Landlord / Property: ${landlordName}${
            landlordPhone ? `, ${landlordPhone}` : ""
          }${landlordAddress ? `, ${landlordAddress}` : ""}`,
          `Lease Start / Move-in Date: ${leaseStartDate}`,
          `Payee: ${payeeName}`,
          `W-9 on file: ${w9OnFile ? "Yes" : "No"}`,
          `Remit to: ${remitTo}`,
          `Mailing / EFT Address: ${mailingOrEftAddress || "—"}`,
          `Previously received a housing deposit benefit: ${
            priorDepositReceived === "yes" ? "Yes" : "No"
          }${
            priorDepositReceived === "yes" && exceptionNote
              ? ` — exception: ${exceptionNote}`
              : ""
          }`,
        ],
      });
    }

    try {
      await downloadPriorAuthPdf(
        {
          paId: record.id,
          requestedOn: record.requestedOn,
          statusLabel: "Requested — pending health plan response",
          memberName: member.name,
          memberId: member.id,
          serviceLabel: service.label,
          healthPlan: member.mcp,
          sections: pdfSections,
        },
        `${record.id}-${service.id}-${member.id}.pdf`
      );
    } catch {
      // PDF generation is a convenience for the demo/printed record — if it
      // fails for any reason, the request itself is still logged and the
      // health-plan message draft below still goes through.
    }

    onSubmitted({
      subject: `Prior Authorization Request — ${service.label} for ${member.name}`,
      body: bodyLines.join("\n"),
    });
    resetForm();
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">
              Prior Authorization Request
            </h2>
            <p className="text-sm text-ink-500">
              {member.name} ({member.id}) · {service.label}
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
          <div className={sectionHeading}>1. Member Information</div>
          <div className={readOnlyPanel}>
            <span>
              <span className="text-ink-400">Name:</span> {member.name}
            </span>
            <span>
              <span className="text-ink-400">DOB:</span> {member.dob}
            </span>
            <span>
              <span className="text-ink-400">CIN:</span> {member.cin || "—"}
            </span>
            <span>
              <span className="text-ink-400">Health Plan ID:</span>{" "}
              {member.healthPlanMemberId || "—"}
            </span>
            <span>
              <span className="text-ink-400">Health Plan:</span> {member.mcp}
            </span>
            <span>
              <span className="text-ink-400">Phone:</span>{" "}
              {member.phone || "—"}
            </span>
            <span className="sm:col-span-2">
              <span className="text-ink-400">Living situation:</span>{" "}
              {member.homeless ? "Experiencing homelessness" : "Stably housed"}
            </span>
          </div>

          <div className={sectionHeading}>
            2. Referring / Requesting Provider
          </div>
          <div className={readOnlyPanel}>
            <span>
              <span className="text-ink-400">Organization:</span>{" "}
              {provider.orgName || "—"}
            </span>
            <span>
              <span className="text-ink-400">NPI:</span> {provider.npi || "—"}
            </span>
            <span>
              <span className="text-ink-400">TIN:</span> {provider.tin || "—"}
            </span>
            <span>
              <span className="text-ink-400">Phone:</span>{" "}
              {provider.phone || "—"}
            </span>
            <span className="sm:col-span-2">
              <span className="text-ink-400">Address:</span>{" "}
              {[provider.address, provider.city, provider.zip]
                .filter(Boolean)
                .join(", ") || "—"}
            </span>
          </div>

          <div className={sectionHeading}>3. Service &amp; Clinical Details</div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={fieldLabel}>Procedure (PA code)</span>
            <div className="h-10 px-3 rounded-lg border border-ink-200 bg-surface-muted text-sm text-ink-700 flex items-center gap-2 w-fit">
              {req?.paCode ? (
                <>
                  <span className="font-mono font-semibold">
                    {req.paCode.hcpcs}
                  </span>
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-brand-500 text-white">
                    {req.paCode.modifier}
                  </span>
                </>
              ) : (
                <span className="text-ink-500 italic">
                  No billing code supplied for this service
                </span>
              )}
              <span className="text-ink-500">{service.label}</span>
            </div>
          </div>

          {req?.targetPopulation && (
            <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-ink-200 bg-surface-muted px-4 py-3">
              <Info size={16} className="text-ink-400 mt-0.5 shrink-0" />
              <p className="text-xs text-ink-600 leading-snug">
                <span className="font-medium text-ink-700">
                  Target population:
                </span>{" "}
                {req.targetPopulation}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pa-start" className={fieldLabel}>
              Requested start date
            </label>
            <input
              id="pa-start"
              type="date"
              value={requestedStartDate}
              onChange={(e) => setRequestedStartDate(e.target.value)}
              required
              className={fieldControl}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pa-end" className={fieldLabel}>
              Service end date (optional)
            </label>
            <input
              id="pa-end"
              type="date"
              value={serviceEndDate}
              onChange={(e) => setServiceEndDate(e.target.value)}
              className={fieldControl}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={fieldLabel}>Diagnosis code(s) (ICD-10)</span>
            <div className="flex flex-wrap gap-2">
              {DIAGNOSIS_PRESETS.map((d) => {
                const selected = diagnosisCodes.includes(d.code);
                return (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => toggleDx(d.code)}
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition ${
                      selected
                        ? "border-brand-500 bg-brand-50 text-brand-600"
                        : "border-ink-200 text-ink-700 hover:bg-surface-muted"
                    }`}
                  >
                    <span className="font-mono">{d.code}</span>
                    {d.label}
                  </button>
                );
              })}
              {diagnosisCodes
                .filter((c) => !DIAGNOSIS_PRESETS.some((d) => d.code === c))
                .map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-brand-500 bg-brand-50 text-brand-600 text-xs font-medium font-mono"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => toggleDx(c)}
                      aria-label={`Remove ${c}`}
                      className="hover:opacity-70"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
            </div>
            <div className="flex gap-2 mt-1">
              <input
                value={customDx}
                onChange={(e) => setCustomDx(e.target.value)}
                placeholder="Add another ICD-10 code"
                className={fieldControl}
              />
              <button
                type="button"
                onClick={addCustomDx}
                className="h-10 px-3 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-surface-muted transition shrink-0"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="pa-amount" className={fieldLabel}>
              {housingDeposit
                ? "Requested dollar amount"
                : "Requested units / frequency / duration"}
            </label>
            <input
              id="pa-amount"
              type={housingDeposit ? "number" : "text"}
              min={housingDeposit ? 0 : undefined}
              step={housingDeposit ? "0.01" : undefined}
              value={requestedUnitsOrAmount}
              onChange={(e) => setRequestedUnitsOrAmount(e.target.value)}
              placeholder={
                housingDeposit ? "0.00" : "e.g. 90 days, 2 meals/day for 12 weeks"
              }
              required
              className={fieldControl}
            />
            {overThreshold && (
              <p className="text-xs text-amber-700 flex items-center gap-1.5">
                <AlertTriangle size={13} />
                Exceeds $5,000 — this plan may require additional/special
                approval.
              </p>
            )}
          </div>

          <div className={sectionHeading}>
            4. Required Documentation
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            {(req?.requiredFields ?? []).map((field) => (
              <label
                key={field}
                className="flex items-start gap-2 text-sm text-ink-700"
              >
                <input
                  type="checkbox"
                  checked={confirmedFields.includes(field)}
                  onChange={() => toggleField(field)}
                  className="accent-brand-500 mt-0.5"
                />
                {field}
              </label>
            ))}
            {req?.limits && (
              <p className="text-xs text-ink-500 leading-snug mt-1">
                <span className="font-medium text-ink-700">
                  Benefit limits:
                </span>{" "}
                {req.limits}
              </p>
            )}
            {req?.mcpNotes && (
              <p className="text-xs text-ink-500 leading-snug">
                <span className="font-medium text-ink-700">MCP notes:</span>{" "}
                {req.mcpNotes}
              </p>
            )}
          </div>

          {housingDeposit && (
            <>
              <div className={sectionHeading}>
                Housing Deposit — Itemized Expense Breakdown
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pa-sec" className={fieldLabel}>
                  Security deposit
                </label>
                <input
                  id="pa-sec"
                  type="number"
                  min={0}
                  step="0.01"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="0.00"
                  className={fieldControl}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pa-util" className={fieldLabel}>
                  Utility connection fees
                </label>
                <input
                  id="pa-util"
                  type="number"
                  min={0}
                  step="0.01"
                  value={utilityFees}
                  onChange={(e) => setUtilityFees(e.target.value)}
                  placeholder="0.00"
                  className={fieldControl}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pa-rent" className={fieldLabel}>
                  First month's rent
                </label>
                <input
                  id="pa-rent"
                  type="number"
                  min={0}
                  step="0.01"
                  value={firstMonthRent}
                  onChange={(e) => setFirstMonthRent(e.target.value)}
                  placeholder="0.00"
                  className={fieldControl}
                />
                <p className="text-xs text-ink-500 leading-snug">
                  Permitted under your plan's guidelines? Rules vary by
                  state/plan — confirm before including.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pa-goods" className={fieldLabel}>
                  Move-in goods / essentials
                </label>
                <input
                  id="pa-goods"
                  type="number"
                  min={0}
                  step="0.01"
                  value={moveInGoods}
                  onChange={(e) => setMoveInGoods(e.target.value)}
                  placeholder="0.00"
                  className={fieldControl}
                />
              </div>

              {amountMismatch && (
                <p className="sm:col-span-2 text-xs text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  Itemized total (${money(itemizedSum)}) doesn't match the
                  requested amount (${money(requestedAmountNum)}) — double
                  check before sending.
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pa-landlord" className={fieldLabel}>
                  Landlord / property management name
                </label>
                <input
                  id="pa-landlord"
                  value={landlordName}
                  onChange={(e) => setLandlordName(e.target.value)}
                  required
                  className={fieldControl}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pa-landlord-phone" className={fieldLabel}>
                  Landlord phone
                </label>
                <input
                  id="pa-landlord-phone"
                  value={landlordPhone}
                  onChange={(e) => setLandlordPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className={fieldControl}
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="pa-landlord-address" className={fieldLabel}>
                  Landlord / property address
                </label>
                <input
                  id="pa-landlord-address"
                  value={landlordAddress}
                  onChange={(e) => setLandlordAddress(e.target.value)}
                  className={fieldControl}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pa-lease" className={fieldLabel}>
                  Lease start / move-in date
                </label>
                <input
                  id="pa-lease"
                  type="date"
                  value={leaseStartDate}
                  onChange={(e) => setLeaseStartDate(e.target.value)}
                  required
                  className={fieldControl}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pa-payee" className={fieldLabel}>
                  Payee name
                </label>
                <input
                  id="pa-payee"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="Usually the landlord or vendor"
                  required
                  className={fieldControl}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className={fieldLabel}>Remit payment to</span>
                <select
                  value={remitTo}
                  onChange={(e) =>
                    setRemitTo(e.target.value as "landlord" | "vendor" | "other")
                  }
                  className={fieldControl}
                >
                  <option value="landlord">Landlord</option>
                  <option value="vendor">Vendor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={w9OnFile}
                  onChange={(e) => setW9OnFile(e.target.checked)}
                  className="accent-brand-500"
                />
                W-9 on file for this payee
              </label>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="pa-remit-address" className={fieldLabel}>
                  Mailing / EFT address for payment
                </label>
                <input
                  id="pa-remit-address"
                  value={mailingOrEftAddress}
                  onChange={(e) => setMailingOrEftAddress(e.target.value)}
                  className={fieldControl}
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className={fieldLabel}>
                  Has this member previously received a housing deposit
                  benefit?
                </span>
                <select
                  value={priorDepositReceived}
                  onChange={(e) =>
                    setPriorDepositReceived(e.target.value as "no" | "yes" | "")
                  }
                  required
                  className={fieldControl}
                >
                  <option value="">Select one</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              {priorDepositReceived === "yes" && (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor="pa-exception" className={fieldLabel}>
                    Exception justification
                  </label>
                  <textarea
                    id="pa-exception"
                    rows={2}
                    value={exceptionNote}
                    onChange={(e) => setExceptionNote(e.target.value)}
                    placeholder="Lifetime/frequency limits usually apply — explain the exception criteria met"
                    required
                    className="px-3 py-2 rounded-lg border border-ink-200 bg-white text-sm text-ink-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition resize-y w-full"
                  />
                </div>
              )}
            </>
          )}

          <div className={sectionHeading}>5. Attestation</div>
          <label className="flex items-start gap-2 text-sm text-ink-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={lifetimeDuplicationAttested}
              onChange={(e) => setLifetimeDuplicationAttested(e.target.checked)}
              className="accent-brand-500 mt-0.5"
            />
            This service does not duplicate an existing State Plan benefit
            and respects any lifetime/frequency limit that applies.
          </label>
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
            Submit Prior Authorization Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriorAuthorizationRequestModal;
