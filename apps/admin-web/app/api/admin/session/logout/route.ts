import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "../../../../../src/auth/adminSession";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);

  return NextResponse.json({ status: "SIGNED_OUT" });
}
