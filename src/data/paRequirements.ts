// Prior authorization requirements, by service — sourced from the
// CalAIM Prior Authorization Requirements Matrix (uploaded reference).
// This is DHCS/CalAIM policy guidance, not a live payer connection: it
// tells the Schedule Appointment / PA request flow what documentation,
// target population, and benefit limits apply to each service, so the
// system can show the right checklist instead of a generic form.
//
// paCode is the HCPCS/modifier the matrix cites for *requesting* prior
// authorization for this service. It may differ from an individual
// billing variant's code in dhcsCodes.ts when a service bundles several
// distinct billable activities (e.g. Day Habilitation) under one PA
// request — see the comment above dhcsServices in dhcsCodes.ts.

export type PAMatrixStatus = "required" | "not_required" | "varies";

export interface PARequirement {
  serviceId: string;
  status: PAMatrixStatus;
  statusNote?: string;
  paCode?: { hcpcs: string; modifier: string };
  targetPopulation: string;
  requiredFields: string[];
  limits: string;
  mcpNotes: string;
}

const REQUIREMENTS: PARequirement[] = [
  // ──────────────── ECM ────────────────
  {
    serviceId: "ecm-care-management",
    status: "not_required",
    targetPopulation:
      "Any DHCS ECM Target Population (Homeless, High-Utilizer, SMI/SUD, LTC, Birth Equity, Children/Youth).",
    requiredFields: [
      "ECM Referral Form",
      "Member CIN",
      "Target Population Verification Checkboxes",
      "Initial Care Needs Assessment",
      "ECM Provider NPI",
    ],
    limits: "No PA — DHCS mandates presumptive, referral-based access.",
    mcpNotes:
      "DHCS explicitly mandates MCPs streamline ECM access. Strict medical PA is prohibited.",
  },
  {
    serviceId: "ecm-outreach",
    status: "not_required",
    targetPopulation: "Members being engaged/enrolled into ECM.",
    requiredFields: ["ECM Referral Form", "Member CIN", "ECM Provider NPI"],
    limits: "No PA.",
    mcpNotes: "Same presumptive-authorization policy as ECM care management.",
  },
  {
    serviceId: "ecm-team-conference",
    status: "not_required",
    targetPopulation: "Enrolled ECM members needing multidisciplinary coordination.",
    requiredFields: ["Member CIN", "ECM Provider NPI"],
    limits: "No PA.",
    mcpNotes: "Same presumptive-authorization policy as ECM care management.",
  },

  // ──────────────── Community Supports ────────────────
  {
    serviceId: "housing-transition-navigation",
    status: "required",
    paCode: { hcpcs: "H0043", modifier: "U2" },
    targetPopulation:
      "Experiencing homelessness, or at risk of homelessness with complex health/behavioral needs.",
    requiredFields: [
      "Member CIN",
      "Target Population Verification",
      "Intake Assessment",
      "Individualized Housing Plan",
      "Referral Source NPI",
    ],
    limits: "Typically time-limited (6–12 months per authorization). Pre-tenancy assistance only.",
    mcpNotes:
      "Must demonstrate the member is actively seeking housing and needs assistance navigating lease/search.",
  },
  {
    serviceId: "housing-deposits",
    status: "required",
    paCode: { hcpcs: "H0044", modifier: "U2" },
    targetPopulation:
      "Members transitioning into permanent housing from homelessness, institution, or congregate setting.",
    requiredFields: [
      "Member CIN",
      "Executed Lease Agreement / Intent to Rent",
      "Itemized Cost Quote (Deposit, First Month Rent, Utilities, Goods)",
      "Landlord/Vendor W-9",
      "Benefit Limit Attestation",
    ],
    limits: "Once-in-a-lifetime benefit per MCP — typically up to $5,000 max (exceptions for extraordinary circumstances).",
    mcpNotes:
      "Payment sent directly to landlord/vendor, never to the member. Requires strict itemized invoice.",
  },
  {
    serviceId: "housing-tenancy-sustaining",
    status: "required",
    paCode: { hcpcs: "H0044", modifier: "U1" },
    targetPopulation:
      "Housed members at risk of lease violation, eviction, or losing housing stability due to health/behavioral conditions.",
    requiredFields: [
      "Member CIN",
      "Housing Status Verification",
      "Risk Assessment (eviction notice, landlord dispute)",
      "Updated Care Plan",
      "Provider NPI",
    ],
    limits: "Re-authorization every 6–12 months based on ongoing housing risk and care plan progress.",
    mcpNotes:
      "Focuses on maintaining tenancy, budgeting, dispute resolution, and connection to ongoing community resources.",
  },
  {
    serviceId: "short-term-post-hospitalization-housing",
    status: "required",
    paCode: { hcpcs: "H0043", modifier: "U1" },
    targetPopulation:
      "Recovering from an acute hospital stay, SNF, or residential rehab; homeless or lacking stable housing for recovery.",
    requiredFields: [
      "Member CIN",
      "Hospital Discharge Summary",
      "Post-Acute Medical Care Plan",
      "Medical Necessity Attestation",
      "Expected Discharge Date",
    ],
    limits: "Up to 6 months (180 continuous days) lifetime maximum. Includes room & board in a transitional facility.",
    mcpNotes:
      "High medical-necessity focus — preventing immediate re-hospitalization or post-surgical complications.",
  },
  {
    serviceId: "recuperative-care",
    status: "required",
    paCode: { hcpcs: "T2023", modifier: "U2" },
    targetPopulation:
      "Homeless members recovering from acute illness/injury requiring medical monitoring, wound care, or IV therapy.",
    requiredFields: [
      "Member CIN",
      "Acute Care Discharge Summary / Order",
      "Clinical Plan of Care",
      "Medical Stability Assessment",
      "Facility Provider NPI",
    ],
    limits: "Up to 90 days maximum per authorization/episode. Includes 24/7 shelter, meals, and nursing supervision.",
    mcpNotes:
      "Member must be medically stable (not requiring acute inpatient care) but unable to recover safely on the street.",
  },
  {
    serviceId: "caregiver-respite",
    status: "required",
    paCode: { hcpcs: "S5150 / S5151", modifier: "U1 / U2" },
    targetPopulation:
      "Members living with an informal caregiver who needs relief to prevent institutionalization/burnout.",
    requiredFields: [
      "Member CIN",
      "Caregiver Assessment",
      "Documentation of Informal Caregiver Hours",
      "Functional Limitations (ADL/IADL count)",
    ],
    limits: "Hourly (S5150) or daily (S5151). Up to 336 hours per calendar year (varies by MCP rule).",
    mcpNotes: "Can be provided in-home or in an out-of-home licensed facility.",
  },
  {
    serviceId: "day-habilitation",
    status: "required",
    paCode: { hcpcs: "T2025", modifier: "U2" },
    targetPopulation:
      "Members with social/cognitive needs requiring structured daytime skill development, socialization, and ADL support.",
    requiredFields: [
      "Member CIN",
      "Functional Assessment",
      "Day Hab Program Care Plan",
      "Medical Clearance / Physician Referral",
    ],
    limits: "Authorized in daily or hourly increments. Re-certified semi-annually or annually.",
    mcpNotes: "Designed to delay or prevent institutionalization (SNF placement) and build independent living skills.",
  },
  {
    serviceId: "assisted-living-transitions",
    status: "required",
    paCode: { hcpcs: "T2038", modifier: "U2" },
    targetPopulation:
      "Members residing in a SNF wishing to transition to an Assisted Living Facility (ALF), or living at home needing ALF-level care.",
    requiredFields: [
      "Member CIN",
      "Level of Care Assessment",
      "ALF Admission Agreement",
      "Financial Assessment (Personal Needs Allowance check)",
      "Service Plan",
    ],
    limits: "Ongoing monthly residential funding (excluding raw room & board where applicable under state rules).",
    mcpNotes: "Helps transition members out of institutional long-term care into home-like community settings.",
  },
  {
    serviceId: "community-home-transition",
    status: "required",
    paCode: { hcpcs: "T2038", modifier: "U1" },
    targetPopulation: "Members transitioning from a SNF or institutional setting back into a home/apartment in the community.",
    requiredFields: [
      "Member CIN",
      "Institutional Discharge Plan",
      "Itemized Expense List (furniture, utility set-up, move fees)",
      "Vendor W-9",
    ],
    limits: "Up to $7,500 lifetime maximum per member.",
    mcpNotes: "Covers non-recurring setup expenses necessary to establish residence.",
  },
  {
    serviceId: "personal-care-homemaker",
    status: "required",
    paCode: { hcpcs: "T1019", modifier: "U2" },
    targetPopulation:
      "Members needing ADL/IADL assistance who are awaiting IHSS approval or need supplemental non-duplicative support.",
    requiredFields: [
      "Member CIN",
      "ADL Assessment / Uniform Assessment Tool",
      "IHSS Application Status / Notice of Action (NOA)",
      "Plan of Care",
    ],
    limits: "Hourly basis — a time-limited bridge service while IHSS is processed, or short-term post-acute relief.",
    mcpNotes: "Cannot duplicate state IHSS services. MCP requires proof of IHSS application or gap-coverage necessity.",
  },
  {
    serviceId: "environmental-accessibility-adaptations",
    status: "required",
    paCode: { hcpcs: "S5165", modifier: "U2" },
    targetPopulation:
      "Members with mobility/physical limitations needing home adaptations to prevent falls or institutionalization.",
    requiredFields: [
      "Member CIN",
      "OT / PT Assessment",
      "Property Owner Consent Form",
      "Contractor Scope of Work & Itemized Bid",
      "Home Photo Documentation",
    ],
    limits: "Up to $7,500 lifetime maximum per member (exceptions for safety upgrades per MCP policy).",
    mcpNotes:
      "Ramps, grab bars, stair lifts, widened doorways, roll-in showers. Requires licensed contractor and property owner sign-off.",
  },
  {
    serviceId: "medically-tailored-meals",
    status: "required",
    paCode: { hcpcs: "S5170 / S9977", modifier: "U2" },
    targetPopulation:
      "Members with chronic conditions (diabetes, CHF, CKD, severe hypertension, HIV) or post-discharge recovery needs.",
    requiredFields: [
      "Member CIN",
      "Chronic Condition Diagnosis (ICD-10)",
      "Dietary Assessment / Clinical Referral",
      "Post-Discharge Verification or Physician Order",
    ],
    limits: "Up to 2 meals/day for 12 weeks (standard). Re-authorizable up to 24 weeks based on clinical necessity.",
    mcpNotes: "Delivers home-prepared meals aligned with the member's clinical nutritional requirements.",
  },
  {
    serviceId: "sobering-centers",
    status: "varies",
    statusNote: "Varies / direct access — no formal pre-authorization required before drop-off/intake.",
    paCode: { hcpcs: "H1000", modifier: "U2" },
    targetPopulation:
      "Intoxicated individuals needing short-term (under 24h) safe, monitored care as an alternative to ER or jail.",
    requiredFields: [
      "Member CIN (or field registration)",
      "Intake Sobriety & Safety Screening",
      "Emergency Contact & Discharge Safety Plan",
    ],
    limits: "Up to 24 hours per episode.",
    mcpNotes:
      "Open referral / direct drop-off (EMS, law enforcement, street outreach) with post-intake notification to the MCP.",
  },
  {
    serviceId: "asthma-remediation",
    status: "required",
    paCode: { hcpcs: "S5165 / S5111", modifier: "U1" },
    targetPopulation: "Members with poorly controlled, severe asthma driven by environmental triggers in the home.",
    requiredFields: [
      "Member CIN",
      "Asthma Diagnosis (ICD-10)",
      "Home Environmental Asthma Assessment (identifying triggers)",
      "Product / Vendor Quote",
    ],
    limits: "Up to $7,500 lifetime maximum per home/member.",
    mcpNotes:
      "Allergen-impermeable mattress/pillow covers, HEPA air purifiers, dehumidifiers, pest remediation.",
  },

  // ──────────── Specialty Behavioral Health ────────────
  {
    serviceId: "smhs-outpatient",
    status: "not_required",
    targetPopulation: "Mental health condition impacting functioning; meets County MHP criteria.",
    requiredFields: [
      "Member CIN",
      "Initial Diagnostic Assessment (can occur concurrently)",
      "Care Plan",
      "Provider NPI",
    ],
    limits: "No PA — treatment starts immediately, prior to completing the full diagnostic assessment.",
    mcpNotes: "DHCS 'No Wrong Door' policy — PA cannot delay initial outpatient care.",
  },
  {
    serviceId: "smhs-residential-crisis",
    status: "required",
    targetPopulation: "Severe psychiatric crisis or functional impairment requiring 24/7 structured sub-acute care.",
    requiredFields: [
      "Member CIN",
      "Psychiatric Evaluation",
      "Crisis Assessment",
      "Level of Care Recommendation (ASAM/LOCUS)",
      "Facility NPI",
    ],
    limits: "Prior authorization or rapid retrospective authorization within 24–48 hours of emergency placement.",
    mcpNotes: "Concurrent review applies for ongoing stays.",
  },
  {
    serviceId: "dmc-ods-outpatient-iop",
    status: "not_required",
    targetPopulation: "SUD assessment indicating a DSM-5 diagnosis or risk for substance use disorder.",
    requiredFields: [
      "Member CIN",
      "ASAM Assessment (completed within 30 days of intake)",
      "Initial Treatment Plan",
      "Provider NPI",
    ],
    limits: "No PA permitted for routine outpatient SUD services — immediate intake required.",
    mcpNotes: "No-Wrong-Door mandate applies.",
  },
  {
    serviceId: "dmc-ods-residential",
    status: "required",
    targetPopulation: "ASAM Level 3 criteria indicating need for 24-hour residential SUD treatment.",
    requiredFields: [
      "Member CIN",
      "Completed ASAM Criteria Assessment",
      "Clinical Intake Notes",
      "Medical Necessity Form",
      "Medical Director Signature",
    ],
    limits: "Up to 24–48 hours post-admission to submit ASAM documentation for authorization.",
    mcpNotes: "Concurrent review — admission can precede full authorization paperwork.",
  },
  {
    serviceId: "dmc-ods-mat",
    status: "not_required",
    targetPopulation: "Diagnosed Opioid Use Disorder (OUD) or Alcohol Use Disorder (AUD).",
    requiredFields: [
      "Member CIN",
      "DEA-licensed Prescriber Order",
      "Clinical Assessment",
      "Pharmacy Claim Submission",
    ],
    limits: "No PA for preferred FDA-approved MAT formulations.",
    mcpNotes: "State law and Medi-Cal policy prohibit PA here to eliminate treatment delays.",
  },
];

export const paRequirementsById: Record<string, PARequirement> =
  Object.fromEntries(REQUIREMENTS.map((r) => [r.serviceId, r]));

export const getPARequirement = (serviceId: string): PARequirement | undefined =>
  paRequirementsById[serviceId];
