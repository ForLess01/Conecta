import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { publishMessage, subscribeToNegotiation } from "../lib/server/negotiation/realtime";
import type { MessageRecord } from "../lib/server/negotiation/conversation-service";

function fakeMessage(negotiationId: string, body: string): MessageRecord {
  return {
    id: `msg-${body}`,
    negotiationId,
    senderActorId: "buyer-1",
    messageType: "TEXT",
    body,
    createdAt: new Date().toISOString(),
  };
}

describe("negotiation realtime pub/sub", () => {
  it("delivers a published message to every subscriber of that negotiation (two sessions, no reload)", () => {
    const negotiationId = "neg-realtime-1";
    const sessionA = vi.fn();
    const sessionB = vi.fn();

    subscribeToNegotiation(negotiationId, sessionA);
    subscribeToNegotiation(negotiationId, sessionB);

    const message = fakeMessage(negotiationId, "hola");
    publishMessage(negotiationId, message);

    expect(sessionA).toHaveBeenCalledWith(message);
    expect(sessionB).toHaveBeenCalledWith(message);
  });

  it("does not leak messages across different negotiations", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    subscribeToNegotiation("neg-realtime-2", listenerA);
    subscribeToNegotiation("neg-realtime-3", listenerB);

    publishMessage("neg-realtime-2", fakeMessage("neg-realtime-2", "solo A"));

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).not.toHaveBeenCalled();
  });

  it("stops delivering after unsubscribe", () => {
    const negotiationId = "neg-realtime-4";
    const listener = vi.fn();
    const unsubscribe = subscribeToNegotiation(negotiationId, listener);

    unsubscribe();
    publishMessage(negotiationId, fakeMessage(negotiationId, "tarde"));

    expect(listener).not.toHaveBeenCalled();
  });
});
