// Prior authorization tracking. There's no real-time connection to payers'
// PA systems (no EDI/portal integration) — this is your side of the
// record: what's been requested, approved, or denied for a given
// member + service, so scheduling can check it automatically instead of
// someone re-typing a PA number every time. Same persisted-list pattern
// as the other stores; newest record for a given member/service wins.

import { useSyncExternalStore } from "react";

export type PriorAuthStatus = "approved" | "requested" | "denied";

/**
 * The detailed documentation payers require for a Housing Deposits
 * (H0044 / U2) request — itemized breakdown, landlord/payee info, and
 * eligibility attestations. Only populated for that service; other
 * service types just use the base fields above.
 */
export interface HousingDepositDetails {
  requestedStartDate: string;
  serviceEndDate?: string;
  diagnosisCodes: string[];
  requestedAmount: number;
  expenses: {
    securityDeposit?: number;
    utilityConnectionFees?: number;
    firstMonthRent?: number;
    moveInGoods?: number;
  };
  landlord: {
    name: string;
    phone?: string;
    address?: string;
  };
  leaseStartDate: string;
  payee: {
    name: string;
    w9OnFile: boolean;
    remitTo: "landlord" | "vendor" | "other";
    mailingOrEftAddress?: string;
  };
  attestation: {
    /** Member is receiving Housing Navigation/Tenancy Sustaining or is
     *  enrolled in ECM — demonstrates the required linkage. */
    linkedToHousingServices: boolean;
    /** Whether the member has previously received this benefit — a
     *  lifetime/frequency limit usually applies unless excepted. */
    priorDepositReceived: "no" | "yes";
    exceptionNote?: string;
  };
}

export interface PriorAuthorization {
  id: string;
  memberId: string;
  member: string;
  serviceId: string;
  serviceLabel: string;
  healthPlan: string;
  status: PriorAuthStatus;
  /** Assigned once approved. */
  number?: string;
  requestedOn: string;
  decidedOn?: string;
  note?: string;
  /** Free-text requested units/frequency/duration or dollar amount —
   *  what's actually being requested (varies by service type). */
  requestedUnitsOrAmount?: string;
  /** Which of the service's required documentation items (from
   *  paRequirements.ts) were confirmed as in hand at request time. */
  documentationConfirmed?: string[];
  /** Attestation that this doesn't duplicate an existing State Plan
   *  benefit and respects any lifetime/frequency limit. */
  lifetimeDuplicationAttested?: boolean;
  /** Housing Deposits requests only — see HousingDepositDetails. */
  housingDeposit?: HousingDepositDetails;
}

const SEED: PriorAuthorization[] = [
  {
    id: "PA-2026-0001",
    memberId: "M-001",
    member: "Maria Garcia",
    serviceId: "housing-transition-navigation",
    serviceLabel: "Housing Transition / Navigation",
    healthPlan: "Health Net",
    status: "approved",
    number: "HN-PA-224871",
    requestedOn: "03-02-2026",
    decidedOn: "03-09-2026",
  },
  {
    id: "PA-2026-0002",
    memberId: "M-002",
    member: "Jane Smith",
    serviceId: "community-home-transition",
    serviceLabel: "Community or Home Transition Services",
    healthPlan: "Health Net",
    status: "requested",
    requestedOn: "04-28-2026",
  },
  {
    id: "PA-2026-0003",
    memberId: "M-003",
    member: "John Doe",
    serviceId: "day-habilitation",
    serviceLabel: "Day Habilitation Programs",
    healthPlan: "Blue Shield Promise",
    status: "denied",
    requestedOn: "02-11-2026",
    decidedOn: "02-20-2026",
    note: "Missing clinical justification — resubmit with updated care plan.",
  },
];

const STORAGE_KEY = "carete.priorAuths.v1";
let priorAuths: PriorAuthorization[] = load();
const listeners = new Set<() => void>();

function load(): PriorAuthorization[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PriorAuthorization[]) : [...SEED];
  } catch {
    return [...SEED];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(priorAuths));
  } catch {
    /* storage full / unavailable — keep in memory */
  }
  listeners.forEach((l) => l());
}

export const getPriorAuths = (): PriorAuthorization[] => priorAuths;

export const addPriorAuth = (pa: PriorAuthorization) => {
  priorAuths = [pa, ...priorAuths];
  persist();
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const usePriorAuths = (): PriorAuthorization[] =>
  useSyncExternalStore(subscribe, getPriorAuths, getPriorAuths);

/** The most recent PA record for this member + service, if any. Records
 *  are stored newest-first, so the first match is the current one. */
export const useLatestPriorAuth = (
  memberId: string,
  serviceId: string
): PriorAuthorization | undefined =>
  usePriorAuths().find(
    (pa) => pa.memberId === memberId && pa.serviceId === serviceId
  );
