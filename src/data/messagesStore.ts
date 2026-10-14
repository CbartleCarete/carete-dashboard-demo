// Shared messages store. Same pattern as claimsStore: a flat list,
// persisted to localStorage, with a tiny subscribe model so every screen
// that reads it stays in sync. There's no email/SMS/call/mail integration
// wired up yet — sending just logs the message here so the UI has
// somewhere real to write to and read from once a provider is connected.

import { useSyncExternalStore } from "react";

export type MessageRecipient = "member" | "care_team" | "provider" | "health_plan";
export type MessageChannel = "email" | "text" | "call" | "letter";

export type Message = {
  id: string;
  memberId: string;
  member: string;
  recipient: MessageRecipient;
  channel: MessageChannel;
  subject?: string;
  body: string;
  sentAt: string;
  status: "sent";
};

export const RECIPIENT_LABELS: Record<MessageRecipient, string> = {
  member: "Member",
  care_team: "Care Team",
  provider: "Provider",
  health_plan: "Health Plan",
};

export const CHANNEL_LABELS: Record<MessageChannel, string> = {
  email: "Email",
  text: "Text",
  call: "Call",
  letter: "Letter",
};

const STORAGE_KEY = "carete.messages.v1";
let messages: Message[] = load();
const listeners = new Set<() => void>();

function load(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* storage full / unavailable — keep in memory */
  }
  listeners.forEach((l) => l());
}

export const getMessages = (): Message[] => messages;

export const addMessage = (message: Message) => {
  messages = [message, ...messages];
  persist();
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Reactive view of every logged message. */
export const useMessages = (): Message[] =>
  useSyncExternalStore(subscribe, getMessages, getMessages);

/** Reactive view of one member's message history. */
export const useMemberMessages = (memberId: string): Message[] =>
  useMessages().filter((m) => m.memberId === memberId);
