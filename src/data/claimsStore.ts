// Shared claims store. Claims were local to Claims.tsx; per-member invoice
// export needs them from MemberDetails too, so they live here, persisted to
// localStorage and seeded from the original sample set. A tiny subscribe
// model keeps every screen in sync without pulling in a state library.

import { useSyncExternalStore } from "react";
import type { BillingUnit } from "./dhcsCodes";
import { closeReferralByClaimId } from "./referralsStore";

const pad = (n: number) => String(n).padStart(2, "0");
const todayDisplay = () => {
  const d = new Date();
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
};

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
  status: "pending" | "active" | "denied" | "appealed";
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
  { id: "CLM-2026-1245", date: "05-02-2026", memberId: "M-002", member: "Jane Smith", serviceId: "day-habilitation", variantId: "day-habilitation", service: "Day Habilitation Programs — Day habilitation (per diem)", hcpcsCode: "T2020", modifiers: ["U2"], unit: "per diem", units: 10, serviceDate: "04-18-2026", chargeAmount: 850, status: "denied", notes: "Denied — prior authorization not on file at time of service. Charge reflects the service as billed." },
  { id: "CLM-2026-1246", date: "04-20-2026", memberId: "M-003", member: "John Doe", serviceId: "recuperative-care", variantId: "default", service: "Recuperative Care (Medical Respite) — per diem", hcpcsCode: "T2023", modifiers: ["U2"], unit: "per diem", units: 5, serviceDate: "03-29-2026", chargeAmount: 1075, status: "appealed", notes: "Appealed 04-20-2026 — supporting documentation resubmitted to health plan. Charge reflects the service as billed." },
];

const STORAGE_KEY = "carete.claims.v2";
let claims: Claim[] = load();
const listeners = new Set<() => void>();

function load(): Claim[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...SEED];
    const parsed = JSON.parse(raw) as Claim[];
    // One-time patch: the denied/appealed sample claims were originally
    // seeded without a chargeAmount, which made a denied claim look like
    // it had no charge at all instead of a billed-but-unpaid amount. Fix
    // those two specific sample rows in any localStorage already saved
    // from before this fix, without touching anything the user added.
    return parsed.map((c) => {
      if (c.id === "CLM-2026-1245" && c.chargeAmount === undefined) {
        return {
          ...c,
          hcpcsCode: "T2020",
          modifiers: ["U2"],
          variantId: "day-habilitation",
          chargeAmount: 850,
        };
      }
      if (c.id === "CLM-2026-1246" && c.chargeAmount === undefined) {
        return { ...c, chargeAmount: 1075 };
      }
      return c;
    });
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

/** Update one claim's status + note in place (e.g. filing an appeal on a
 *  denied claim, or marking one paid). No-op if the claim id isn't found.
 *  Marking a claim "active" (paid) also closes out whichever referral it
 *  was created for, if any — a referral's Close stage means claimed AND
 *  paid, so payment is what finishes that loop. */
export const updateClaimStatus = (
  id: string,
  status: Claim["status"],
  note?: string
) => {
  claims = claims.map((c) =>
    c.id === id ? { ...c, status, notes: note ?? c.notes } : c
  );
  persist();
  if (status === "active") {
    closeReferralByClaimId(id, todayDisplay());
  }
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
