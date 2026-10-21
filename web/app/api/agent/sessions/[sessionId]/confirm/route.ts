import { NextRequest, NextResponse } from "next/server";

import { confirmSessionPayload } from "@/lib/server-agent-runtime";
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
  const response = await confirmSessionPayload(sessionId, user.id);
  if (!response) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(response, {
    headers: { "cache-control": "no-store" },
  });
}
