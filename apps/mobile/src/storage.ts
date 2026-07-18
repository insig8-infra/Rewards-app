import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { Language } from "./i18n";

const keys = {
  session: "volt-rewards:end-user-session",
  recentContractor: "volt-rewards:team-member-recent-contractor",
  language: "volt-rewards:language",
} as const;

export interface StoredSession {
  readonly token: string;
  readonly role: "CONTRACTOR" | "TEAM_MEMBER";
  readonly contractorId: string;
  readonly teamMemberMobile?: string;
  readonly expiresAt: string;
  readonly contractor: {
    readonly name: string;
    readonly mobileNumber: string;
    readonly photoUrl?: string;
    readonly tier?: string;
    readonly totalAccumulatedPoints: number;
    readonly availablePoints: number;
  };
}

export interface StoredRecentContractor {
  readonly contractorId: string;
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly savedAt: string;
}

export async function saveSession(session: StoredSession): Promise<void> {
  await setItem(keys.session, JSON.stringify(session));
}

export async function getSession(): Promise<StoredSession | null> {
  return parseJson<StoredSession>(await getItem(keys.session));
}

export async function clearSession(): Promise<void> {
  await deleteItem(keys.session);
}

export async function saveRecentContractor(recent: StoredRecentContractor): Promise<void> {
  await setItem(keys.recentContractor, JSON.stringify(recent));
}

export async function getRecentContractor(): Promise<StoredRecentContractor | null> {
  return parseJson<StoredRecentContractor>(await getItem(keys.recentContractor));
}

export async function clearRecentContractor(): Promise<void> {
  await deleteItem(keys.recentContractor);
}

export async function saveLanguage(language: Language): Promise<void> {
  await setItem(keys.language, language);
}

export async function getLanguage(): Promise<Language | null> {
  const language = await getItem(keys.language);
  return language === "hi" || language === "en" ? language : null;
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
