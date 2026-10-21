import { NextRequest, NextResponse } from "next/server";

import { postSessionMessagePayload } from "@/lib/server-agent-runtime";
import { getCurrentUser } from "@/lib/server-auth-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const message = String(payload.message || "").trim();
  if (!message) {
    return NextResponse.json({ error: "Missing required field: message" }, { status: 400 });
  }
  const response = await postSessionMessagePayload(sessionId, user.id, message);
  if (!response) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(response, {
    headers: { "cache-control": "no-store" },
  });
}
