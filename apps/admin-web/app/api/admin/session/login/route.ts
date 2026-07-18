import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminApiBaseUrl,
  getAdminSessionCookieOptions,
} from "../../../../../src/auth/adminSession";
import type { AdminLoginResponse } from "../../../../../src/auth/adminSessionTypes";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const backendBody =
    typeof body === "object" && body !== null
      ? { ...body, surface: "ADMIN_WEB" }
      : { surface: "ADMIN_WEB" };

  const response = await fetch(`${getAdminApiBaseUrl()}/auth/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(backendBody),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as AdminLoginResponse | { readonly message?: string } | null;

  if (!response.ok || !isAdminLoginResponse(payload)) {
    return NextResponse.json(payload ?? { message: "Admin login failed." }, { status: response.status });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, payload.session.token, getAdminSessionCookieOptions(new Date(payload.session.expiresAt)));

  return NextResponse.json({
    status: payload.status,
    admin: payload.admin,
    session: {
      expiresAt: payload.session.expiresAt,
      actor: payload.session.actor,
    },
  });
}

function isAdminLoginResponse(value: unknown): value is AdminLoginResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    (value as { readonly status?: unknown }).status === "AUTHENTICATED" &&
    "session" in value
  );
}
