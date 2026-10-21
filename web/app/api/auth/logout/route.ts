import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, logoutCurrentToken } from "@/lib/server-auth-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await logoutCurrentToken();
  const response = NextResponse.json({ ok: true }, {
    headers: { "cache-control": "no-store" },
  });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
