import type { NextRequest } from "next/server";
import {
  ConversationPermissionError,
  getNegotiation,
  type MessageRecord,
} from "@/lib/server/negotiation/conversation-service";
import { subscribeToNegotiation } from "@/lib/server/negotiation/realtime";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const HEARTBEAT_MS = 25_000;

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const actorId = request.nextUrl.searchParams.get("actorId");

  if (!actorId) {
    return new Response("actorId query parameter is required.", { status: 400 });
  }

  try {
    const negotiation = await getNegotiation(id, actorId);
    if (!negotiation) {
      return new Response("Negotiation not found.", { status: 404 });
    }
  } catch (error) {
    if (error instanceof ConversationPermissionError) {
      return new Response("Not a participant of this negotiation.", { status: 403 });
    }
    return new Response("Negotiation could not be retrieved.", { status: 500 });
  }

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(sseEvent({ type: "connected" })));

      unsubscribe = subscribeToNegotiation(id, (message: MessageRecord) => {
        controller.enqueue(encoder.encode(sseEvent({ type: "message", message })));
      });

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, HEARTBEAT_MS);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe?.();
        controller.close();
      });
    },
    cancel() {
      clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
