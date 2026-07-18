import "server-only";

import { EventEmitter } from "node:events";
import type { MessageRecord } from "./conversation-service";

// Demo-only realtime: an in-process pub/sub keyed by negotiation, delivered
// over SSE. Stands in for Supabase Realtime (`postgres_changes` on
// `messages`) until that project is wired — swap `publishMessage`/
// `subscribeToNegotiation` for a Supabase channel then, same call sites.
const globalRealtimeState = globalThis as typeof globalThis & {
  conectaNegotiationEmitter?: EventEmitter;
};

function getEmitter(): EventEmitter {
  if (!globalRealtimeState.conectaNegotiationEmitter) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(0);
    globalRealtimeState.conectaNegotiationEmitter = emitter;
  }
  return globalRealtimeState.conectaNegotiationEmitter;
}

function channelName(negotiationId: string): string {
  return `negotiation:${negotiationId}`;
}

export function publishMessage(negotiationId: string, message: MessageRecord): void {
  getEmitter().emit(channelName(negotiationId), message);
}

export function subscribeToNegotiation(
  negotiationId: string,
  listener: (message: MessageRecord) => void,
): () => void {
  const emitter = getEmitter();
  const event = channelName(negotiationId);
  emitter.on(event, listener);
  return () => emitter.off(event, listener);
}
