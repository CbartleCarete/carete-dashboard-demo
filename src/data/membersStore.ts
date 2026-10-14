// Shared members store. members.json is static; editing a member (CIN,
// address, etc. needed for payer forms) and reading the same list from
// several screens needs one mutable source. Seeded from members.json,
// persisted to localStorage, same subscribe model as claimsStore.

import { useSyncExternalStore } from "react";
import seed from "./members.json";
import type { Member } from "../utils/membersUtils";

const STORAGE_KEY = "carete.members.v2";
let members: Member[] = load();
const listeners = new Set<() => void>();

function load(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Member[]) : (seed as Member[]);
  } catch {
    return seed as Member[];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {
    /* keep in memory */
  }
  listeners.forEach((l) => l());
}

export const getMembers = (): Member[] => members;

export const updateMember = (id: string, patch: Partial<Member>) => {
  members = members.map((m) => (m.id === id ? { ...m, ...patch } : m));
  persist();
};

export const addMember = (m: Member) => {
  members = [...members, m];
  persist();
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useMembers = (): Member[] =>
  useSyncExternalStore(subscribe, getMembers, getMembers);

export const useMember = (id: string | undefined): Member | undefined =>
  useMembers().find((m) => m.id === id);
