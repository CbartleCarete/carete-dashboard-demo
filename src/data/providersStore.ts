// Mock provider directory for appointment scheduling. There's no real
// provider network or calendar integration yet — this seeds a small,
// editable set of providers (each tied to the DHCS service types they
// deliver) with a handful of upcoming open slots, persisted to
// localStorage with the same subscribe model as the other stores.
// Booking a slot removes it from the provider's availability.

import { useSyncExternalStore } from "react";

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  /** dhcsServices ids this provider can deliver. */
  serviceIds: string[];
  /** Upcoming open slots, as "YYYY-MM-DDTHH:mm" local datetime strings. */
  slots: string[];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** A slot N days from today at a given hour (and optional minute). */
const slotFrom = (dayOffset: number, hour: number, minute = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    hour
  )}:${pad(minute)}`;
};

/** "Thu, Jun 12 · 9:00 AM" */
export const formatSlot = (iso: string): string => {
  const [datePart, timePart] = iso.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);
  const date = new Date(y, m - 1, d, h, min);
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateLabel} · ${timeLabel}`;
};

const SEED_PROVIDERS: Provider[] = [
  {
    id: "PRV-001",
    name: "Dr. Amara Okafor",
    specialty: "ECM — Clinical Care Management",
    serviceIds: ["ecm-care-management"],
    slots: [slotFrom(2, 9), slotFrom(3, 13), slotFrom(6, 10), slotFrom(9, 14)],
  },
  {
    id: "PRV-002",
    name: "Marcus Webb, LCSW",
    specialty: "ECM — Outreach & Non-Clinical Care Management",
    serviceIds: ["ecm-outreach", "ecm-team-conference", "ecm-care-management"],
    slots: [slotFrom(1, 11), slotFrom(4, 9), slotFrom(5, 15), slotFrom(8, 10)],
  },
  {
    id: "PRV-003",
    name: "Horizon Housing Partners",
    specialty: "Housing Navigation & Transition Services",
    serviceIds: [
      "housing-transition-navigation",
      "housing-deposits",
      "community-home-transition",
    ],
    slots: [slotFrom(2, 10), slotFrom(3, 14), slotFrom(7, 9), slotFrom(10, 11)],
  },
  {
    id: "PRV-004",
    name: "Riverside Tenancy Services",
    specialty: "Tenancy Sustaining & Home Accessibility",
    serviceIds: [
      "housing-tenancy-sustaining",
      "environmental-accessibility-adaptations",
    ],
    slots: [slotFrom(1, 13), slotFrom(4, 16), slotFrom(6, 9), slotFrom(9, 10)],
  },
  {
    id: "PRV-005",
    name: "Valley Recuperative Care Center",
    specialty: "Recuperative Care & Post-Hospitalization Housing",
    serviceIds: ["recuperative-care", "short-term-post-hospitalization-housing"],
    slots: [slotFrom(2, 8), slotFrom(3, 11), slotFrom(5, 13), slotFrom(8, 9)],
  },
  {
    id: "PRV-006",
    name: "Bright Path Caregiver Services",
    specialty: "Caregiver Respite & Day Habilitation",
    serviceIds: ["caregiver-respite", "day-habilitation"],
    slots: [slotFrom(1, 9), slotFrom(4, 13), slotFrom(7, 15), slotFrom(10, 9)],
  },
  {
    id: "PRV-007",
    name: "Golden Oak Senior Living",
    specialty: "Assisted Living Transitions & Personal Care",
    serviceIds: ["assisted-living-transitions", "personal-care-homemaker"],
    slots: [slotFrom(2, 11), slotFrom(5, 9), slotFrom(6, 14), slotFrom(9, 13)],
  },
  {
    id: "PRV-008",
    name: "Community Wellness Network",
    specialty: "Meals, Sobering Services & Environmental Remediation",
    serviceIds: [
      "medically-tailored-meals",
      "sobering-centers",
      "asthma-remediation",
    ],
    slots: [slotFrom(1, 10), slotFrom(3, 9), slotFrom(6, 15), slotFrom(8, 11)],
  },
  {
    id: "PRV-009",
    name: "Fresno County Behavioral Health",
    specialty: "SMHS Outpatient & Crisis Residential Treatment",
    serviceIds: ["smhs-outpatient", "smhs-residential-crisis"],
    slots: [slotFrom(1, 9), slotFrom(2, 13), slotFrom(5, 10), slotFrom(9, 14)],
  },
  {
    id: "PRV-010",
    name: "Valley Recovery Partners",
    specialty: "DMC-ODS Outpatient, Residential SUD & MAT",
    serviceIds: ["dmc-ods-outpatient-iop", "dmc-ods-residential", "dmc-ods-mat"],
    slots: [slotFrom(1, 11), slotFrom(3, 15), slotFrom(6, 9), slotFrom(9, 13)],
  },
];

const STORAGE_KEY = "carete.providers.v1";
let providers: Provider[] = load();
const listeners = new Set<() => void>();

function load(): Provider[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Provider[]) : [...SEED_PROVIDERS];
  } catch {
    return [...SEED_PROVIDERS];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
  } catch {
    /* storage full / unavailable — keep in memory */
  }
  listeners.forEach((l) => l());
}

export const getProviders = (): Provider[] => providers;

/** Remove a booked slot from a provider's availability. */
export const bookSlot = (providerId: string, slot: string) => {
  providers = providers.map((p) =>
    p.id === providerId ? { ...p, slots: p.slots.filter((s) => s !== slot) } : p
  );
  persist();
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useProviders = (): Provider[] =>
  useSyncExternalStore(subscribe, getProviders, getProviders);

/** Providers who can deliver a given service, sorted by name. */
export const useProvidersForService = (serviceId: string): Provider[] =>
  useProviders()
    .filter((p) => p.serviceIds.includes(serviceId))
    .sort((a, b) => a.name.localeCompare(b.name));
