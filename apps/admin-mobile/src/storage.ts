import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { AdminLoginResponse } from "./api";

export interface StoredAdminSession {
  readonly token: string;
  readonly expiresAt: string;
  readonly role: "OWNER" | "STAFF";
  readonly userId: string;
  readonly name: string;
  readonly mobileNumber: string;
  readonly staffId?: string;
}

const sessionKey = "volt-admin-session-v1";

export async function saveSession(login: AdminLoginResponse): Promise<StoredAdminSession> {
  const session: StoredAdminSession = {
    token: login.session.token,
    expiresAt: login.session.expiresAt,
    role: login.admin.role,
    userId: login.admin.userId,
    name: login.admin.name,
    mobileNumber: login.admin.mobileNumber,
    ...(login.admin.staffId ? { staffId: login.admin.staffId } : {}),
  };
  await setItem(sessionKey, JSON.stringify(session));
  return session;
}

export async function getSession(): Promise<StoredAdminSession | null> {
  const raw = await getItem(sessionKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAdminSession;
    if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
      return parsed;
    }
  } catch {
    await clearSession();
  }

  return null;
}

export async function clearSession(): Promise<void> {
  await deleteItem(sessionKey);
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
