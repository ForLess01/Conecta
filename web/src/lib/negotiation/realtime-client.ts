import type { MessageRecord } from "@/lib/server/negotiation/conversation-service";

type StreamEvent =
  | { type: "connected" }
  | { type: "message"; message: MessageRecord };

/**
 * Client-side subscription to a negotiation's live messages (SSE today,
 * same call shape a future Supabase Realtime channel would expose).
 * Returns an unsubscribe function; call it on unmount.
 */
export function subscribeToNegotiationStream(
  negotiationId: string,
  actorId: string,
  onMessage: (message: MessageRecord) => void,
): () => void {
  const source = new EventSource(
    `/api/negotiations/conversations/${negotiationId}/stream?actorId=${encodeURIComponent(actorId)}`,
  );

  source.onmessage = (event) => {
    const payload = JSON.parse(event.data) as StreamEvent;
    if (payload.type === "message") {
      onMessage(payload.message);
    }
  };

  return () => source.close();
}
