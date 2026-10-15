// Referral records — the "Screen → Refer" front end of the workflow,
// feeding into the scheduling/PA/claims pipeline that already exists.
// Same store pattern as everywhere else: a flat list, persisted to
// localStorage, with a tiny subscribe model.

import { useSyncExternalStore } from "react";

export type ReferralStatus =
  | "pending"
  | "accepted"
  | "scheduled"
  | "claimed"
  | "closed";
export type ReferralOutcomeType = "completed" | "declined" | "no_show" | "other";

/** One provider shown to the consumer as an option. */
export interface ReferralOption {
  providerId: string;
  providerName: string;
  specialty: string;
}

export interface Referral {
  id: string;
  memberId: string;
  member: string;
  serviceId: string;
  serviceLabel: string;
  /** Why the referral was made — the "Screen" finding that led to it. */
  reason: string;
  /** The shortlist presented to the consumer. */
  optionsPresented: ReferralOption[];
  /** Set once the consumer has decided. */
  chosenProviderId?: string;
  chosenProviderName?: string;
  status: ReferralStatus;
  createdOn: string;
  decidedOn?: string;
  /** Set once "Schedule Appointment" has been used for this referral. */
  appointmentId?: string;
  scheduledOn?: string;
  /** Set once a claim has been created for the delivered service — the
   *  referral moves to "claimed" and waits here until that claim is paid. */
  claimId?: string;
  claimedOn?: string;
  /** Required to move a referral to "closed" — the documented outcome.
   *  Reaching "closed" normally happens automatically once the linked
   *  claim is paid (see closeReferralByClaimId), but it can also be set
   *  manually (e.g. a no-show, or the consumer declining every option). */
  outcomeType?: ReferralOutcomeType;
  outcome?: string;
  closedOn?: string;
}

export const OUTCOME_TYPE_LABELS: Record<ReferralOutcomeType, string> = {
  completed: "Completed",
  declined: "Declined",
  no_show: "No-show",
  other: "Other",
};

const SEED: Referral[] = [
  {
    id: "REF-2026-010",
    memberId: "M-004",
    member: "Robert Johnson",
    serviceId: "day-habilitation",
    serviceLabel: "Day Habilitation Programs",
    reason:
      "Member reports limited daytime activity and increasing isolation since his last home visit.",
    optionsPresented: [
      {
        providerId: "PRV-006",
        providerName: "Bright Path Caregiver Services",
        specialty: "Caregiver Respite & Day Habilitation",
      },
    ],
    status: "pending",
    createdOn: "05-04-2026",
  },
  {
    id: "REF-2026-011",
    memberId: "M-002",
    member: "Jane Smith",
    serviceId: "housing-transition-navigation",
    serviceLabel: "Housing Transition / Navigation",
    reason:
      "Referred for housing navigation support ahead of her upcoming lease renewal.",
    optionsPresented: [
      {
        providerId: "PRV-003",
        providerName: "Horizon Housing Partners",
        specialty: "Housing Navigation & Transition Services",
      },
    ],
    chosenProviderId: "PRV-003",
    chosenProviderName: "Horizon Housing Partners",
    status: "accepted",
    createdOn: "04-26-2026",
    decidedOn: "04-28-2026",
  },
  {
    id: "REF-2026-012",
    memberId: "M-003",
    member: "John Doe",
    serviceId: "personal-care-homemaker",
    serviceLabel: "Personal Care & Homemaker Services",
    reason:
      "Referred for in-home personal care support following a fall risk screening.",
    optionsPresented: [
      {
        providerId: "PRV-007",
        providerName: "Golden Oak Senior Living",
        specialty: "Assisted Living Transitions & Personal Care",
      },
    ],
    chosenProviderId: "PRV-007",
    chosenProviderName: "Golden Oak Senior Living",
    status: "scheduled",
    createdOn: "04-10-2026",
    decidedOn: "04-12-2026",
    appointmentId: "APT-2026-021",
    scheduledOn: "04-16-2026",
  },
  {
    id: "REF-2026-013",
    memberId: "M-007",
    member: "James Wilson",
    serviceId: "ecm-care-management",
    serviceLabel: "ECM — Care Management",
    reason:
      "Screening flagged gaps in chronic condition follow-up; referred for clinical care management.",
    optionsPresented: [
      {
        providerId: "PRV-001",
        providerName: "Dr. Amara Okafor",
        specialty: "ECM — Clinical Care Management",
      },
      {
        providerId: "PRV-002",
        providerName: "Marcus Webb, LCSW",
        specialty: "ECM — Outreach & Non-Clinical Care Management",
      },
    ],
    chosenProviderId: "PRV-001",
    chosenProviderName: "Dr. Amara Okafor",
    status: "claimed",
    createdOn: "09-20-2025",
    decidedOn: "09-23-2025",
    appointmentId: "APT-2025-058",
    scheduledOn: "10-01-2025",
    claimId: "CLM-2024-1234",
    claimedOn: "10-13-2025",
  },
  {
    id: "REF-2025-014",
    memberId: "M-005",
    member: "Sarah Chen",
    serviceId: "ecm-care-management",
    serviceLabel: "ECM — Care Management",
    reason:
      "Referred for clinical care management following a missed medication refill.",
    optionsPresented: [
      {
        providerId: "PRV-001",
        providerName: "Dr. Amara Okafor",
        specialty: "ECM — Clinical Care Management",
      },
    ],
    chosenProviderId: "PRV-001",
    chosenProviderName: "Dr. Amara Okafor",
    status: "closed",
    createdOn: "10-05-2025",
    decidedOn: "10-07-2025",
    appointmentId: "APT-2025-061",
    scheduledOn: "10-11-2025",
    claimId: "CLM-2024-1238",
    claimedOn: "10-19-2025",
    outcomeType: "completed",
    outcome: "Service delivered — claim CLM-2024-1238 paid in full.",
    closedOn: "10-19-2025",
  },
  {
    id: "REF-2026-015",
    memberId: "M-001",
    member: "Maria Garcia",
    serviceId: "assisted-living-transitions",
    serviceLabel: "Assisted Living Facility Transitions",
    reason: "Referred for assisted living transition support after a fall at home.",
    optionsPresented: [
      {
        providerId: "PRV-007",
        providerName: "Golden Oak Senior Living",
        specialty: "Assisted Living Transitions & Personal Care",
      },
    ],
    status: "closed",
    createdOn: "03-18-2026",
    decidedOn: "03-20-2026",
    outcomeType: "declined",
    outcome:
      "Member declined all presented options — chose to remain in her current living situation.",
    closedOn: "03-20-2026",
  },
];

const STORAGE_KEY = "carete.referrals.v1";
let referrals: Referral[] = load();
const listeners = new Set<() => void>();

function load(): Referral[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...SEED];
    const parsed = JSON.parse(raw) as Referral[];

    // One-time repair: earlier referral IDs were only guaranteed unique
    // within a single member's own list, so two referrals (sometimes for
    // the same member) could end up sharing an ID. Every action here
    // (decide/schedule/close) matches by ID, so a shared ID meant acting
    // on "one" referral silently acted on every referral that shared it.
    // Give any duplicate a new, unique ID — no other data is touched.
    const seenIds = new Set<string>();
    let patched = false;
    const fixed = parsed.map((r) => {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        return r;
      }
      patched = true;
      let suffix = 2;
      let newId = `${r.id}-${suffix}`;
      while (seenIds.has(newId)) {
        suffix += 1;
        newId = `${r.id}-${suffix}`;
      }
      seenIds.add(newId);
      return { ...r, id: newId };
    });

    if (patched) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fixed));
      } catch {
        /* storage full / unavailable — the in-memory fix still applies */
      }
    }

    return fixed;
  } catch {
    return [...SEED];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(referrals));
  } catch {
    /* storage full / unavailable — keep in memory */
  }
  listeners.forEach((l) => l());
}

export const getReferrals = (): Referral[] => referrals;

export const addReferral = (referral: Referral) => {
  referrals = [referral, ...referrals];
  persist();
};

/** Record the consumer's decision — which presented option they picked,
 *  or none, if they decline every option on the spot. */
export const decideReferral = (
  id: string,
  decidedOn: string,
  choice: { providerId: string; providerName: string } | null
) => {
  referrals = referrals.map((r) => {
    if (r.id !== id) return r;
    if (!choice) {
      // Declining every option on the spot closes the loop immediately —
      // still requires the documented outcome, same as any other closure.
      return {
        ...r,
        status: "closed",
        decidedOn,
        outcomeType: "declined",
        outcome: "Consumer declined all presented options.",
        closedOn: decidedOn,
      };
    }
    return {
      ...r,
      status: "accepted",
      decidedOn,
      chosenProviderId: choice.providerId,
      chosenProviderName: choice.providerName,
    };
  });
  persist();
};

/** Link a referral to the appointment created from it (Route/Verify/
 *  Deliver all continue through the existing scheduling flow from here). */
export const markReferralScheduled = (
  id: string,
  appointmentId: string,
  scheduledOn: string
) => {
  referrals = referrals.map((r) =>
    r.id === id
      ? { ...r, status: "scheduled", appointmentId, scheduledOn }
      : r
  );
  persist();
};

/** Link a referral to the claim created for the service it was for — the
 *  "Claim" stage. The referral now waits here until that claim is paid. */
export const markReferralClaimed = (
  id: string,
  claimId: string,
  claimedOn: string
) => {
  referrals = referrals.map((r) =>
    r.id === id ? { ...r, status: "claimed", claimId, claimedOn } : r
  );
  persist();
};

/** The "Close" stage, reached automatically: once the claim linked to a
 *  referral is paid, the referral it came from is done — claimed and
 *  paid — so it closes itself with a "completed" outcome. No-op for any
 *  claim that isn't linked to a referral still waiting on it. */
export const closeReferralByClaimId = (claimId: string, closedOn: string) => {
  referrals = referrals.map((r) =>
    r.claimId === claimId && r.status === "claimed"
      ? {
          ...r,
          status: "closed",
          outcomeType: "completed",
          outcome: `Service delivered — claim ${claimId} paid in full.`,
          closedOn,
        }
      : r
  );
  persist();
};

/** Close a referral — requires a documented outcome (no silent closure). */
export const closeReferral = (
  id: string,
  outcomeType: ReferralOutcomeType,
  outcome: string,
  closedOn: string
) => {
  referrals = referrals.map((r) =>
    r.id === id ? { ...r, status: "closed", outcomeType, outcome, closedOn } : r
  );
  persist();
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useReferrals = (): Referral[] =>
  useSyncExternalStore(subscribe, getReferrals, getReferrals);

export const useMemberReferrals = (memberId: string): Referral[] =>
  useReferrals().filter((r) => r.memberId === memberId);
