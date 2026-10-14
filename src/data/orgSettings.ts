// Billing / rendering provider identity for the org. This is the same on every
// claim and every payer form, so it's entered once and persisted locally
// (no backend in this app). Read by the PDF fill engine.

export interface ProviderIdentity {
  npi: string;
  tin: string;
  /** Last name or organization name */
  orgName: string;
  firstName: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
}

export interface OrgSettings {
  billing: ProviderIdentity;
  /** Rendering provider — if blank, billing info is reused on the form. */
  rendering: Partial<ProviderIdentity>;
  /** Per-payer "Payor Primary ID" keyed by payer id. */
  payorPrimaryIds: Record<string, string>;
}

const STORAGE_KEY = "carete.orgSettings.v2";

const emptyProvider: ProviderIdentity = {
  npi: "",
  tin: "",
  orgName: "",
  firstName: "",
  address: "",
  city: "",
  zip: "",
  phone: "",
};

// Placeholder CBO identity so exports work out of the box during testing.
// Real orgs overwrite this in Settings.
export const defaultOrgSettings: OrgSettings = {
  billing: {
    npi: "1093817558",
    tin: "87-2031945",
    orgName: "Carete Community Services",
    firstName: "",
    address: "2400 Mariposa St, Suite 210",
    city: "Fresno",
    zip: "93721",
    phone: "(559) 555-0188",
  },
  rendering: {},
  payorPrimaryIds: { healthnet: "HN-CS-44821" },
};

export const loadOrgSettings = (): OrgSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultOrgSettings);
    const parsed = JSON.parse(raw) as Partial<OrgSettings>;
    return {
      billing: { ...emptyProvider, ...parsed.billing },
      rendering: parsed.rendering ?? {},
      payorPrimaryIds: parsed.payorPrimaryIds ?? {},
    };
  } catch {
    return structuredClone(defaultOrgSettings);
  }
};

export const saveOrgSettings = (settings: OrgSettings): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

/** Effective rendering provider — falls back to billing for any blank field. */
export const effectiveRendering = (s: OrgSettings): ProviderIdentity => ({
  ...s.billing,
  ...Object.fromEntries(
    Object.entries(s.rendering).filter(([, v]) => v && String(v).trim())
  ),
});
