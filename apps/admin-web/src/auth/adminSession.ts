import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Route } from "next";
import type { AdminDashboard } from "../api/adminApi";
import type { AdminRole, AdminSessionView } from "./adminSessionTypes";

export const ADMIN_SESSION_COOKIE = "volt_admin_web_session";

const defaultApiBaseUrl = "http://127.0.0.1:3000/api";

export function getAdminApiBaseUrl(): string {
  return (process.env.ADMIN_WEB_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl).replace(/\/$/, "");
}

export function getAdminSessionCookieOptions(expiresAt?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(expiresAt ? { expires: expiresAt } : {}),
  };
}

export async function getAdminSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function requireAdminSession(options: {
  readonly allowedRoles?: readonly AdminRole[];
  readonly loginRedirectTo: string;
}): Promise<AdminSessionView> {
  const token = await getAdminSessionToken();
  if (!token) {
    redirect(`/login?next=${encodeURIComponent(options.loginRedirectTo)}` as Route);
  }

  const dashboard = await fetchAdminBackend<AdminDashboard>("/admin-web/dashboard", {
    token,
    method: "GET",
  });

  if (!dashboard.ok) {
    redirect(`/login?expired=1&next=${encodeURIComponent(options.loginRedirectTo)}` as Route);
  }

  const session: AdminSessionView = {
    role: dashboard.data.actorRole,
    roleLabel: dashboard.data.roleLabel,
    allowedSections: dashboard.data.allowedSections,
  };

  if (options.allowedRoles && !options.allowedRoles.includes(session.role)) {
    redirect("/dashboard?denied=1" as Route);
  }

  return session;
}

export async function fetchAdminBackend<T>(
  path: string,
  input: {
    readonly token: string;
    readonly method?: string;
    readonly body?: BodyInit | null;
    readonly headers?: HeadersInit;
    readonly search?: string;
  },
): Promise<{ readonly ok: true; readonly status: number; readonly data: T } | { readonly ok: false; readonly status: number; readonly text: string }> {
  const headers = new Headers(input.headers);
  headers.set("authorization", `Bearer ${input.token}`);
  if (input.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const fetchInit: RequestInit = {
    method: input.method ?? "GET",
    headers,
    cache: "no-store",
  };

  if (input.body !== undefined) {
    fetchInit.body = input.body;
  }

  const response = await fetch(`${getAdminApiBaseUrl()}${path}${input.search ?? ""}`, fetchInit);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      text: await response.text(),
    };
  }

  return {
    ok: true,
    status: response.status,
    data: (await response.json()) as T,
  };
}
