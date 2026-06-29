// Shared claims store. Claims were local to Claims.tsx; per-member invoice
// export needs them from MemberDetails too, so they live here, persisted to
// localStorage and seeded from the original sample set. A tiny subscribe
// model keeps every screen in sync without pulling in a state library.

import { useSyncExternalStore } from "react";
import type { BillingUnit } from "./dhcsCodes";

/** Canonical service/claim record. A member accrues these; an exported
 *  invoice ("claim") is a bundle of them. */
export type Claim = {
  id: string;
  date: string;
  memberId: string;
  member: string;
  serviceId: string;
  variantId: string;
  service: string;
  hcpcsCode: string;
  modifiers: string[];
  unit: BillingUnit;
  units: number;
  serviceDate: string;
  status: "pending" | "active" | "denied";
  notes?: string;
  serviceStartDate?: string;
  serviceEndDate?: string;
  placeOfService?: string;
  diagnosisCodes?: string[];
  chargeAmount?: number;
};

const SEED: Claim[] = [
  { id: "CLM-2024-1234", date: "10-13-2025", memberId: "M-007", member: "James Wilson", serviceId: "ecm-care-management", variantId: "clinical-in-person", service: "ECM — Care Management — Clinical staff — in person", hcpcsCode: "G9008", modifiers: ["U1"], unit: "per encounter", units: 1, serviceDate: "11-11-2025", status: "pending" },
  { id: "CLM-2024-1235", date: "01-26-2025", memberId: "M-002", member: "Jane Smith", serviceId: "community-home-transition", variantId: "transition", service: "Community or Home Transition Services — Transition services & expenses (per service)", hcpcsCode: "T2038", modifiers: ["U5"], unit: "per service", units: 1, serviceDate: "03-11-2025", status: "active" },
  { id: "CLM-2024-1236", date: "10-28-2025", memberId: "M-003", member: "John Doe", serviceId: "ecm-care-management", variantId: "nonclinical-in-person", service: "ECM — Care Management — Non-clinical staff — in person", hcpcsCode: "G9012", modifiers: ["U2"], unit: "per encounter", units: 1, serviceDate: "06-11-2025", status: "active" },
  { id: "CLM-2026-1240", date: "04-30-2026", memberId: "M-001", member: "Maria Garcia", serviceId: "housing-transition-navigation", variantId: "supported-housing", service: "Housing Transition / Navigation — Supported housing services (per diem)", hcpcsCode: "H0043", modifiers: ["U6"], unit: "per diem", units: 30, serviceDate: "04-01-2026", serviceStartDate: "04-01-2026", serviceEndDate: "04-30-2026", placeOfService: "12", diagnosisCodes: ["Z59.0", "F32.9"], chargeAmount: 2250, status: "active" },
  { id: "CLM-2026-1241", date: "04-30-2026", memberId: "M-001", member: "Maria Garcia", serviceId: "ecm-care-management", variantId: "clinical-in-person", service: "ECM — Care Management — Clinical staff — in person", hcpcsCode: "G9008", modifiers: ["U1"], unit: "per encounter", units: 2, serviceDate: "04-08-2026", serviceStartDate: "04-08-2026", serviceEndDate: "04-22-2026", placeOfService: "12", diagnosisCodes: ["F32.9", "E11.9"], chargeAmount: 420, status: "active" },
  { id: "CLM-2026-1242", date: "04-30-2026", memberId: "M-001", member: "Maria Garcia", serviceId: "housing-tenancy-sustaining", variantId: "financial-mgmt-15", service: "Housing Tenancy & Sustaining Services — Financial management (per 15 min)", hcpcsCode: "T2040", modifiers: ["U6"], unit: "per 15 minutes", units: 8, serviceDate: "04-10-2026", serviceStartDate: "04-10-2026", serviceEndDate: "04-10-2026", placeOfService: "12", diagnosisCodes: ["Z59.0"], chargeAmount: 200, status: "pending" },
  { id: "CLM-2026-1243", date: "04-30-2026", memberId: "M-001", member: "Maria Garcia", serviceId: "medically-tailored-meals", variantId: "meals", service: "Medically Tailored Meals / Medically Supportive Food — Medically tailored meals (per meal)", hcpcsCode: "S5170", modifiers: ["U6"], unit: "per meal", units: 60, serviceDate: "04-01-2026", serviceStartDate: "04-01-2026", serviceEndDate: "04-30-2026", placeOfService: "12", diagnosisCodes: ["E11.9"], chargeAmount: 900, status: "active" },
  { id: "CLM-2026-1244", date: "04-30-2026", memberId: "M-001", member: "Maria Garcia", serviceId: "personal-care-homemaker", variantId: "homemaker", service: "Personal Care & Homemaker Services — Homemaker services (per 15 min)", hcpcsCode: "S5130", modifiers: ["U6"], unit: "per 15 minutes", units: 16, serviceDate: "04-15-2026", serviceStartDate: "04-15-2026", serviceEndDate: "04-29-2026", placeOfService: "12", diagnosisCodes: ["Z59.0", "F32.9"], chargeAmount: 400, status: "pending" },
  { id: "CLM-2024-1238", date: "10-19-2025", memberId: "M-005", member: "Sarah Chen", serviceId: "ecm-care-management", variantId: "clinical-in-person", service: "ECM — Care Management — Clinical staff — in person", hcpcsCode: "G9008", modifiers: ["U1"], unit: "per encounter", units: 1, serviceDate: "10-11-2025", status: "active" },
];

const STORAGE_KEY = "carete.claims.v2";
let claims: Claim[] = load();
const listeners = new Set<() => void>();

function load(): Claim[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Claim[]) : [...SEED];
  } catch {
    return [...SEED];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
  } catch {
    /* storage full / unavailable — keep in memory */
  }
  listeners.forEach((l) => l());
}

export const getClaims = (): Claim[] => claims;

export const addClaim = (claim: Claim) => {
  claims = [claim, ...claims];
  persist();
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Reactive view of all claims. */
export const useClaims = (): Claim[] =>
  useSyncExternalStore(subscribe, getClaims, getClaims);

/** Reactive view of one member's claims. */
export const useMemberClaims = (memberId: string): Claim[] =>
  useClaims().filter((c) => c.memberId === memberId);
