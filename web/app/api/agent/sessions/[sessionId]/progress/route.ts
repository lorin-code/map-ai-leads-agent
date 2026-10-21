import { NextRequest } from "next/server";

import { getSessionPayload } from "@/lib/server-agent-runtime";
import { getCurrentUser } from "@/lib/server-auth-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

function hasAssistantCompletion(payload: Awaited<ReturnType<typeof getSessionPayload>>, after: number) {
  if (!payload) {
    return true;
  }

  return payload.messages.slice(after + 1).some(
    (message) => message.role === "assistant" && message.tool_name && message.tool_name !== "working",
  );
}

function sse(data: unknown, event = "message") {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { sessionId } = await context.params;
  const after = Number(request.nextUrl.searchParams.get("after") || 0);
  const encoder = new TextEncoder();

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  let ticks = 0;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const emit = async () => {
        if (closed) {
          return;
        }

        ticks += 1;
        try {
          const payload = await getSessionPayload(sessionId, user.id);
          if (!payload) {
            controller.enqueue(encoder.encode(sse({ error: "Session not found" }, "error")));
            controller.close();
            closed = true;
            if (intervalId) {
              clearInterval(intervalId);
            }
            return;
          }

          const done = hasAssistantCompletion(payload, after);
          controller.enqueue(
            encoder.encode(
              sse({
                done,
                sessionId: payload.sessionId,
                state: payload.state,
                summary: payload.summary,
              }),
            ),
          );

          if (done || ticks >= 600) {
            controller.close();
            closed = true;
            if (intervalId) {
              clearInterval(intervalId);
            }
          }
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              sse(
                {
                  error: error instanceof Error ? error.message : "Progress stream failed",
                },
                "error",
              ),
            ),
          );
          controller.close();
          closed = true;
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      };

      void emit();
      intervalId = setInterval(() => {
        void emit();
      }, 1000);
    },
    cancel() {
      closed = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "cache-control": "no-store, no-transform",
      connection: "keep-alive",
      "content-type": "text/event-stream; charset=utf-8",
      "x-accel-buffering": "no",
    },
  });
}
