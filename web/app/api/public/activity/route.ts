import { NextResponse } from "next/server";

import { publicActivityPayload } from "@/lib/server-agent-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await publicActivityPayload(), {
    headers: { "cache-control": "no-store" },
  });
}
