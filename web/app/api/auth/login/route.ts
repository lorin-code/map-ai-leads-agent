import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, loginPasswordUser } from "@/lib/server-auth-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "");

  if (!username || !password) {
    return NextResponse.json({ error: "请输入账号和密码" }, { status: 400 });
  }

  try {
    const login = await loginPasswordUser(username, password);
    const response = NextResponse.json(
      {
        user: login.user,
      },
      {
        headers: { "cache-control": "no-store" },
      },
    );
    response.cookies.set(AUTH_COOKIE_NAME, login.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "账号或密码不正确" }, { status: 401 });
  }
}
