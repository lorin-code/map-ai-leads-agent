import { NextRequest, NextResponse } from "next/server";

import { createSessionPayload, listSessionsPayload } from "@/lib/server-agent-runtime";
import { getCurrentUser } from "@/lib/server-auth-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await listSessionsPayload(user.id), {
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const title = String(payload.title || "新建线索会话").trim() || "新建线索会话";
  return NextResponse.json(await createSessionPayload(title, user.id), {
    headers: { "cache-control": "no-store" },
  });
}
