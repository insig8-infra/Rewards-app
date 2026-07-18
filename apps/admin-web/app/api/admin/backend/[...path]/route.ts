import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminApiBaseUrl,
} from "../../../../../src/auth/adminSession";

type ProxyContext = {
  readonly params: Promise<{
    readonly path: readonly string[];
  }>;
};

export async function GET(request: NextRequest, context: ProxyContext) {
  return proxyAdminRequest(request, context);
}

export async function POST(request: NextRequest, context: ProxyContext) {
  return proxyAdminRequest(request, context);
}

export async function PATCH(request: NextRequest, context: ProxyContext) {
  return proxyAdminRequest(request, context);
}

async function proxyAdminRequest(request: NextRequest, context: ProxyContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Admin session is required." }, { status: 401 });
  }

  const { path } = await context.params;
  const backendPath = `/${path.map(encodeURIComponent).join("/")}`;
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  const fetchInit: RequestInit = {
    method: request.method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": request.headers.get("content-type") ?? "application/json" } : {}),
    },
    cache: "no-store",
  };

  if (body !== undefined) {
    fetchInit.body = body;
  }

  const response = await fetch(`${getAdminApiBaseUrl()}${backendPath}${request.nextUrl.search}`, fetchInit);
  const responseBody = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") ?? "application/json";
  const contentDisposition = response.headers.get("content-disposition");

  if (response.status === 401) {
    cookieStore.delete(ADMIN_SESSION_COOKIE);
  }

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "content-type": contentType,
      ...(contentDisposition ? { "content-disposition": contentDisposition } : {}),
    },
  });
}
