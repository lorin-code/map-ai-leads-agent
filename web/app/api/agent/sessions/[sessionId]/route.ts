import { NextRequest, NextResponse } from "next/server";

import { deleteSessionPayload, getSessionPayload } from "@/lib/server-agent-runtime";
import { getCurrentUser } from "@/lib/server-auth-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await context.params;
  const payload = await getSessionPayload(sessionId, user.id);
  if (!payload) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(payload, {
    headers: { "cache-control": "no-store" },
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await context.params;
  const payload = await deleteSessionPayload(sessionId, user.id);
  if (!payload.deleted) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(payload, {
    headers: { "cache-control": "no-store" },
  });
}
