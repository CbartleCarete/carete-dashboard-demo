// Shared appointments store. Same pattern as claimsStore/messagesStore: a
// flat list, persisted to localStorage, subscribe model for reactivity.

import { useSyncExternalStore } from "react";

export type AppointmentStatus = "scheduled";

export interface Appointment {
  id: string;
  memberId: string;
  member: string;
  serviceId: string;
  serviceLabel: string;
  requiresPriorAuth: boolean;
  /**
   * "not_required" when the service doesn't need one; "on_file" when an
   * approved PA was found and auto-attached; "pending" when the service
   * needs one but no approved PA is on file yet (none found, or one is
   * requested/denied) — the appointment is still schedulable, just
   * flagged as contingent on authorization.
   */
  priorAuthStatus: "not_required" | "on_file" | "pending";
  priorAuthNumber?: string;
  providerId: string;
  providerName: string;
  /** Chosen slot, as a "YYYY-MM-DDTHH:mm" local datetime string. */
  slot: string;
  scheduledOn: string;
  status: AppointmentStatus;
}

const STORAGE_KEY = "carete.appointments.v1";
let appointments: Appointment[] = load();
const listeners = new Set<() => void>();

function load(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Appointment[]) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  } catch {
    /* storage full / unavailable — keep in memory */
  }
  listeners.forEach((l) => l());
}

export const getAppointments = (): Appointment[] => appointments;

export const addAppointment = (appointment: Appointment) => {
  appointments = [appointment, ...appointments];
  persist();
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useAppointments = (): Appointment[] =>
  useSyncExternalStore(subscribe, getAppointments, getAppointments);

export const useMemberAppointments = (memberId: string): Appointment[] =>
  useAppointments().filter((a) => a.memberId === memberId);
