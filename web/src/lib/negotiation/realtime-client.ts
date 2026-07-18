import { createClient } from "@/lib/supabase/client";
import type { CommerceMessage, NegotiationDetail } from "@/lib/server/commerce/types";

type StreamEvent =
  | { type: "message"; message: CommerceMessage }
  | { type: "refresh" };

/**
 * Client-side subscription to persisted negotiation changes through Supabase Realtime.
 * Returns an unsubscribe function; call it on unmount.
 */
export function subscribeToNegotiationStream(
  negotiationId: string,
  onEvent: (event: StreamEvent) => void,
): () => void {
  const supabase = createClient();
  let active = true;
  let channel: ReturnType<typeof supabase.channel> | undefined;
  let lastStateSignature: string | undefined;
  const seenMessages = new Set<string>();

  function receiveMessage(message: Record<string, unknown>) {
    const id = String(message.id);
    if (seenMessages.has(id)) return;
    seenMessages.add(id);
    onEvent({
        type: "message",
        message: {
          id,
          senderActorId: String(message.sender_actor_id),
          type: message.message_type as CommerceMessage["type"],
          body: message.body == null ? null : String(message.body),
          createdAt: String(message.created_at),
        },
      });
  }

  void (async () => {
    await supabase.realtime.setAuth();
    if (!active) return;
    const handleBroadcast = ({ payload }: { payload: { table?: string; record?: Record<string, unknown> } }) => {
      if (payload.table === "messages" && payload.record) receiveMessage(payload.record);
      else onEvent({ type: "refresh" });
    };
    channel = supabase
      .channel(`negotiation:${negotiationId}`, { config: { private: true } })
      .on("broadcast", { event: "INSERT" }, handleBroadcast)
      .on("broadcast", { event: "UPDATE" }, handleBroadcast)
      .on("broadcast", { event: "DELETE" }, handleBroadcast)
      .subscribe();
  })();

  async function pollPersistedState() {
    try {
      const response = await fetch(`/api/negotiations/conversations/${negotiationId}`, { cache: "no-store" });
      if (!response.ok || !active) return;
      const negotiation = await response.json() as NegotiationDetail;
      negotiation.messages.forEach((message) => receiveMessage({
        id: message.id,
        sender_actor_id: message.senderActorId,
        message_type: message.type,
        body: message.body,
        created_at: message.createdAt,
      }));
      const signature = JSON.stringify({
        status: negotiation.status,
        proposals: negotiation.proposals.map(({ id, status }) => [id, status]),
      });
      if (lastStateSignature && signature !== lastStateSignature) onEvent({ type: "refresh" });
      lastStateSignature = signature;
    } catch {
      // Realtime reconnects automatically; the next poll retries persisted state.
    }
  }

  void pollPersistedState();
  const poll = setInterval(() => void pollPersistedState(), 3_000);

  return () => {
    active = false;
    clearInterval(poll);
    if (channel) void supabase.removeChannel(channel);
  };
}
