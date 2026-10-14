// DHCS HCPCS Coding Guidance for ECM and Community Supports (v1.3, January 2026).
// Source: https://www.dhcs.ca.gov/Documents/MCQMD/Coding-Options-for-ECM-and-Community-Supports.pdf
// These codes are interim until permanent HCPCS codes are established.

export type BillingUnit =
  | "per encounter"
  | "per diem"
  | "per month"
  | "per 15 minutes"
  | "per meal"
  | "per week"
  | "per session"
  | "per service";

export type ServiceCategory =
  | "ECM"
  | "Community Supports"
  | "Specialty Behavioral Health";

export interface Variant {
  id: string;
  label: string;
  hcpcsCode: string;
  modifiers: string[];
  unit: BillingUnit;
  allowsTelehealth?: boolean;
  note?: string;
  /**
   * Default dollar rate per billing unit, used to prepopulate the
   * charge amount on encounter (`defaultRate × units`).
   *
   * Mock rates calibrated against typical California Medi-Cal MCP
   * fee schedules for CalAIM ECM and Community Supports — meant as
   * sensible defaults that the user can override per claim.
   *
   * Intentionally omitted on "actual cost" pass-through services
   * (housing deposits, ALF / community transitions, EAA home mods),
   * where the billed amount is the receipt/invoice and there is no
   * meaningful default to seed.
   */
  defaultRate?: number;
}

export interface Service {
  id: string;
  label: string;
  category: ServiceCategory;
  description: string;
  /**
   * Whether this service typically requires prior authorization before
   * scheduling/delivery. Placeholder defaults — mocked similarly to the
   * default billing rates above — meant to be corrected against your
   * payers' actual PA rules rather than treated as authoritative.
   */
  requiresPriorAuth?: boolean;
  variants: Variant[];
}

export const dhcsServices: Service[] = [
  // ──────────────── ECM ────────────────
  {
    id: "ecm-care-management",
    label: "ECM — Care Management",
    category: "ECM",
    requiresPriorAuth: false,
    description: "Enhanced Care Management services for enrolled members.",
    variants: [
      {
        id: "clinical-in-person",
        label: "Clinical staff — in person",
        hcpcsCode: "G9008",
        modifiers: ["U1"],
        unit: "per encounter",
        defaultRate: 210,
      },
      {
        id: "clinical-telehealth",
        label: "Clinical staff — phone/telehealth",
        hcpcsCode: "G9008",
        modifiers: ["U1", "GQ"],
        unit: "per encounter",
        allowsTelehealth: true,
        defaultRate: 210,
      },
      {
        id: "nonclinical-in-person",
        label: "Non-clinical staff — in person",
        hcpcsCode: "G9012",
        modifiers: ["U2"],
        unit: "per encounter",
        defaultRate: 140,
      },
      {
        id: "nonclinical-telehealth",
        label: "Non-clinical staff — phone/telehealth",
        hcpcsCode: "G9012",
        modifiers: ["U2", "GQ"],
        unit: "per encounter",
        allowsTelehealth: true,
        defaultRate: 140,
      },
    ],
  },
  {
    id: "ecm-outreach",
    label: "ECM — Outreach / Enrollment",
    category: "ECM",
    requiresPriorAuth: false,
    description:
      "Single outreach attempt to initiate a member into ECM. Use for both successful and unsuccessful attempts.",
    variants: [
      {
        id: "clinical-in-person",
        label: "Clinical staff — in person",
        hcpcsCode: "G9008",
        modifiers: ["U8"],
        unit: "per encounter",
        defaultRate: 75,
      },
      {
        id: "clinical-telehealth",
        label: "Clinical staff — telephonic/electronic",
        hcpcsCode: "G9008",
        modifiers: ["U8", "GQ"],
        unit: "per encounter",
        allowsTelehealth: true,
        note: "Mass mailings/distribution emails do not count as outreach.",
        defaultRate: 75,
      },
      {
        id: "nonclinical-in-person",
        label: "Non-clinical staff — in person",
        hcpcsCode: "G9012",
        modifiers: ["U8"],
        unit: "per encounter",
        defaultRate: 50,
      },
      {
        id: "nonclinical-telehealth",
        label: "Non-clinical staff — telephonic/electronic",
        hcpcsCode: "G9012",
        modifiers: ["U8", "GQ"],
        unit: "per encounter",
        allowsTelehealth: true,
        defaultRate: 50,
      },
    ],
  },
  {
    id: "ecm-team-conference",
    label: "ECM — Multidisciplinary Team Conference",
    category: "ECM",
    requiresPriorAuth: false,
    description:
      "Team conference between the member's lead care manager and other providers involved in care.",
    variants: [
      {
        id: "default",
        label: "Scheduled team conference",
        hcpcsCode: "G9007",
        modifiers: [],
        unit: "per encounter",
        defaultRate: 175,
      },
    ],
  },

  // ──────────────── Community Supports ────────────────
  {
    id: "housing-transition-navigation",
    label: "Housing Transition / Navigation",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "Helping a member find and move into housing.",
    variants: [
      {
        id: "supported-housing",
        label: "Supported housing services (per diem)",
        hcpcsCode: "H0043",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 75,
      },
      {
        id: "comprehensive",
        label: "Comprehensive community support (per diem)",
        hcpcsCode: "H2016",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 95,
      },
    ],
  },
  {
    id: "housing-deposits",
    label: "Housing Deposits",
    category: "Community Supports",
    requiresPriorAuth: true,
    description:
      "Security deposits, first month's rent, and other move-in costs. Deposit amount required on encounter.",
    variants: [
      {
        id: "default",
        label: "Housing deposit (per month)",
        hcpcsCode: "H0044",
        modifiers: ["U2"],
        unit: "per month",
        note: "Billed amount required on encounter — enter the actual deposit/receipt total.",
      },
    ],
  },
  {
    id: "housing-tenancy-sustaining",
    label: "Housing Tenancy & Sustaining Services",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "Ongoing support to help a member keep stable housing.",
    variants: [
      {
        id: "financial-mgmt-15",
        label: "Financial management (per 15 min)",
        hcpcsCode: "T2040",
        modifiers: ["U1"],
        unit: "per 15 minutes",
        defaultRate: 25,
      },
      {
        id: "financial-mgmt-diem",
        label: "Financial management (per diem)",
        hcpcsCode: "T2050",
        modifiers: ["U1"],
        unit: "per diem",
        defaultRate: 90,
      },
      {
        id: "support-brokerage-15",
        label: "Support brokerage (per 15 min)",
        hcpcsCode: "T2041",
        modifiers: ["U1"],
        unit: "per 15 minutes",
        defaultRate: 25,
      },
      {
        id: "support-brokerage-diem",
        label: "Support brokerage (per diem)",
        hcpcsCode: "T2051",
        modifiers: ["U1"],
        unit: "per diem",
        defaultRate: 90,
      },
    ],
  },
  {
    id: "recuperative-care",
    label: "Recuperative Care (Medical Respite)",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "Short-term residential care for recovery after discharge.",
    variants: [
      {
        id: "default",
        label: "Residential care (per diem)",
        hcpcsCode: "T2023",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 215,
      },
    ],
  },
  {
    id: "short-term-post-hospitalization-housing",
    label: "Short-Term Post-Hospitalization Housing",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "Temporary housing immediately after hospital discharge.",
    variants: [
      {
        id: "per-diem",
        label: "Supported housing (per diem)",
        hcpcsCode: "H0043",
        modifiers: ["U1"],
        unit: "per diem",
        defaultRate: 185,
      },
      {
        id: "per-month",
        label: "Supported housing (per month)",
        hcpcsCode: "H0044",
        modifiers: ["U1"],
        unit: "per month",
        defaultRate: 4000,
      },
    ],
  },
  {
    id: "caregiver-respite",
    label: "Caregiver Respite",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "Short-term relief for a member's primary caregiver.",
    variants: [
      {
        id: "hourly",
        label: "Respite care (hourly)",
        hcpcsCode: "S5150",
        modifiers: ["U1"],
        unit: "per 15 minutes",
        defaultRate: 15,
      },
      {
        id: "not-in-home",
        label: "Respite care, not in the home (per diem)",
        hcpcsCode: "H0045",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 180,
      },
      {
        id: "unskilled-not-hospice",
        label: "Unskilled respite care, not hospice (per diem)",
        hcpcsCode: "S5151",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 140,
      },
      {
        id: "in-home",
        label: "Respite care, in the home (per diem)",
        hcpcsCode: "S9125",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 160,
      },
    ],
  },
  {
    id: "day-habilitation",
    label: "Day Habilitation Programs",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "Skill-building and vocational programs.",
    variants: [
      {
        id: "educational",
        label: "Educational habilitation (per diem)",
        hcpcsCode: "T2012",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 90,
      },
      {
        id: "prevocational",
        label: "Prevocational habilitation (per diem)",
        hcpcsCode: "T2014",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 95,
      },
      {
        id: "supported-employment-diem",
        label: "Supported employment habilitation (per diem)",
        hcpcsCode: "T2018",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 100,
      },
      {
        id: "day-habilitation",
        label: "Day habilitation (per diem)",
        hcpcsCode: "T2020",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 85,
      },
      {
        id: "skills-training-15",
        label: "Skills training & development (per 15 min)",
        hcpcsCode: "H2014",
        modifiers: ["U2"],
        unit: "per 15 minutes",
        defaultRate: 20,
      },
      {
        id: "skills-training-diem",
        label: "Skills training & development (per diem)",
        hcpcsCode: "H2038",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 80,
      },
      {
        id: "supported-employment",
        label: "Supported employment (per diem)",
        hcpcsCode: "H2024",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 110,
      },
      {
        id: "ongoing-employment-support",
        label: "Ongoing support to maintain employment (per diem)",
        hcpcsCode: "H2026",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 95,
      },
    ],
  },
  {
    id: "assisted-living-transitions",
    label: "Assisted Living Facility Transitions",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "Transition into an assisted living facility and ongoing wrap-around services.",
    variants: [
      {
        id: "transition",
        label: "Transition services & expenses (per service)",
        hcpcsCode: "T2038",
        modifiers: ["U2"],
        unit: "per service",
        note: "Billed amount required on encounter.",
      },
      {
        id: "ongoing",
        label: "Ongoing assisted living services (per diem)",
        hcpcsCode: "H2022",
        modifiers: ["U2"],
        unit: "per diem",
        note: "Billed amount required on encounter.",
      },
    ],
  },
  {
    id: "community-home-transition",
    label: "Community or Home Transition Services",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "Helping a member transition from an institution to the community.",
    variants: [
      {
        id: "transition",
        label: "Transition services & expenses (per service)",
        hcpcsCode: "T2038",
        modifiers: ["U1"],
        unit: "per service",
        note: "Billed amount required on encounter.",
      },
      {
        id: "setup",
        label: "Non-recurring set-up expenses (per month)",
        hcpcsCode: "H0044",
        modifiers: ["U1"],
        unit: "per month",
        defaultRate: 2500,
      },
    ],
  },
  {
    id: "personal-care-homemaker",
    label: "Personal Care & Homemaker Services",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "In-home personal care and homemaker help.",
    variants: [
      {
        id: "homemaker",
        label: "Homemaker services (per 15 min)",
        hcpcsCode: "S5130",
        modifiers: ["U2"],
        unit: "per 15 minutes",
        defaultRate: 25,
      },
      {
        id: "personal-care",
        label: "Personal care services (per 15 min)",
        hcpcsCode: "T1019",
        modifiers: ["U2"],
        unit: "per 15 minutes",
        defaultRate: 28,
      },
    ],
  },
  {
    id: "environmental-accessibility-adaptations",
    label: "Environmental Accessibility Adaptations (Home Modifications)",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "Home modifications (ramps, grab bars, etc.) to keep a member safe at home.",
    variants: [
      {
        id: "default",
        label: "Home modifications (per service)",
        hcpcsCode: "S5165",
        modifiers: ["U2"],
        unit: "per service",
        note: "Billed amount required on encounter.",
      },
    ],
  },
  {
    id: "medically-tailored-meals",
    label: "Medically Tailored Meals / Medically Supportive Food",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "Food-as-medicine services including meals, nutrition education, and groceries.",
    variants: [
      {
        id: "meals",
        label: "Medically tailored meals (per meal)",
        hcpcsCode: "S5170",
        modifiers: ["U2"],
        unit: "per meal",
        defaultRate: 15,
      },
      {
        id: "nutrition-ed-individual",
        label: "Nutrition education — individual (per 15 min)",
        hcpcsCode: "S9452",
        modifiers: ["U5"],
        unit: "per 15 minutes",
        defaultRate: 30,
      },
      {
        id: "nutrition-ed-group",
        label: "Nutrition education — group (per 15 min)",
        hcpcsCode: "S9452",
        modifiers: ["U6"],
        unit: "per 15 minutes",
        defaultRate: 12,
      },
      {
        id: "nutritional-assessment",
        label: "Nutritional assessment (per 15 min)",
        hcpcsCode: "S9470",
        modifiers: ["U6"],
        unit: "per 15 minutes",
        defaultRate: 35,
      },
      {
        id: "produce-box",
        label: "Produce prescription — box (per week)",
        hcpcsCode: "S9977",
        modifiers: ["U4"],
        unit: "per week",
        defaultRate: 40,
      },
      {
        id: "produce-retail",
        label: "Produce prescription — retail (per week)",
        hcpcsCode: "S9977",
        modifiers: ["U5"],
        unit: "per week",
        defaultRate: 40,
      },
      {
        id: "tailored-groceries",
        label: "Medically tailored groceries (per week)",
        hcpcsCode: "S9977",
        modifiers: ["U6"],
        unit: "per week",
        defaultRate: 80,
      },
      {
        id: "supportive-groceries",
        label: "Medically supportive groceries (per week)",
        hcpcsCode: "S9977",
        modifiers: ["U7"],
        unit: "per week",
        defaultRate: 60,
      },
      {
        id: "food-pharmacy",
        label: "Food pharmacy (per session)",
        hcpcsCode: "S9977",
        modifiers: ["U8"],
        unit: "per session",
        defaultRate: 50,
      },
      {
        id: "food-vouchers",
        label: "Healthy food vouchers (per month)",
        hcpcsCode: "S9977",
        modifiers: ["U9"],
        unit: "per month",
        defaultRate: 200,
      },
    ],
  },
  {
    id: "sobering-centers",
    label: "Sobering Centers",
    category: "Community Supports",
    requiresPriorAuth: false,
    description: "Short-term supervised care for alcohol or drug intoxication.",
    variants: [
      {
        id: "default",
        label: "Ambulatory detoxification",
        hcpcsCode: "H1000",
        modifiers: ["U2"],
        unit: "per diem",
        defaultRate: 350,
      },
    ],
  },
  {
    id: "asthma-remediation",
    label: "Asthma Remediation",
    category: "Community Supports",
    requiresPriorAuth: true,
    description: "Home remediation to reduce asthma triggers.",
    variants: [
      {
        id: "default",
        label: "Home modifications (per service)",
        hcpcsCode: "S5165",
        modifiers: ["U1"],
        unit: "per service",
        defaultRate: 1500,
      },
    ],
  },

  // ──────────── Specialty Behavioral Health (SMHS & DMC-ODS) ────────────
  // No HCPCS/modifier was given in the PA matrix for these — they're
  // billed differently (county MHP / DMC-ODS claim types), not CalAIM
  // community-support codes. Billing fields are left blank rather than
  // guessed; fill in your county's actual codes before using these for
  // claims.
  {
    id: "smhs-outpatient",
    label: "SMHS — Outpatient Assessment, Therapy & MD Services",
    category: "Specialty Behavioral Health",
    requiresPriorAuth: false,
    description:
      "Outpatient mental health assessment, therapy, and medication services. DHCS 'No Wrong Door' policy — treatment starts before a full diagnostic assessment is complete; PA cannot delay initial outpatient care.",
    variants: [
      {
        id: "default",
        label: "Outpatient visit",
        hcpcsCode: "",
        modifiers: [],
        unit: "per encounter",
        note: "No billing code supplied in your PA matrix — enter your county MHP's actual code.",
      },
    ],
  },
  {
    id: "smhs-residential-crisis",
    label: "SMHS — Adult Residential & Crisis Residential Treatment",
    category: "Specialty Behavioral Health",
    requiresPriorAuth: true,
    description:
      "24/7 structured sub-acute psychiatric care for severe crisis or functional impairment. Prior authorization or rapid retrospective authorization within 24–48 hours of emergency placement.",
    variants: [
      {
        id: "default",
        label: "Residential / crisis residential stay (per diem)",
        hcpcsCode: "",
        modifiers: [],
        unit: "per diem",
        note: "No billing code supplied in your PA matrix — enter your county MHP's actual code.",
      },
    ],
  },
  {
    id: "dmc-ods-outpatient-iop",
    label: "DMC-ODS — Outpatient & Intensive Outpatient (IOP) SUD Services",
    category: "Specialty Behavioral Health",
    requiresPriorAuth: false,
    description:
      "Routine outpatient and intensive outpatient substance use treatment. No prior authorization permitted — immediate intake required under the No-Wrong-Door mandate.",
    variants: [
      {
        id: "default",
        label: "Outpatient / IOP visit",
        hcpcsCode: "",
        modifiers: [],
        unit: "per encounter",
        note: "No billing code supplied in your PA matrix — enter your county DMC-ODS plan's actual code.",
      },
    ],
  },
  {
    id: "dmc-ods-residential",
    label: "DMC-ODS — Residential SUD Treatment (ASAM 3.1 / 3.3 / 3.5)",
    category: "Specialty Behavioral Health",
    requiresPriorAuth: true,
    description:
      "24-hour residential substance use treatment for members meeting ASAM Level 3 criteria. Provider has up to 24–48 hours post-admission to submit ASAM documentation for authorization.",
    variants: [
      {
        id: "default",
        label: "Residential SUD treatment (per diem)",
        hcpcsCode: "",
        modifiers: [],
        unit: "per diem",
        note: "No billing code supplied in your PA matrix — enter your county DMC-ODS plan's actual code.",
      },
    ],
  },
  {
    id: "dmc-ods-mat",
    label: "DMC-ODS — Medication-Assisted Treatment (MAT)",
    category: "Specialty Behavioral Health",
    requiresPriorAuth: false,
    description:
      "Buprenorphine, methadone, or naltrexone for diagnosed OUD/AUD. State law and Medi-Cal policy prohibit PA for preferred FDA-approved MAT formulations to eliminate treatment delays.",
    variants: [
      {
        id: "default",
        label: "MAT visit / dispensing",
        hcpcsCode: "",
        modifiers: [],
        unit: "per encounter",
        note: "No billing code supplied in your PA matrix — enter your pharmacy/MAT provider's actual code.",
      },
    ],
  },
];

export const getServiceById = (id: string): Service | undefined =>
  dhcsServices.find((s) => s.id === id);

export const getVariant = (
  serviceId: string,
  variantId: string
): Variant | undefined => getServiceById(serviceId)?.variants.find((v) => v.id === variantId);
