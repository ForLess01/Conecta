import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  ConversationNotFoundError,
  ConversationPermissionError,
  ConversationServerConfigurationError,
  ConversationTransitionError,
  cancelConversation,
  createProposal,
  getNegotiation,
  listMessages,
  respondToProposal,
  resetDemoConversationStore,
  sendMessage,
  startConversation,
} from "../lib/server/negotiation/conversation-service";
import { getOrder, resetDemoOrderStore } from "../lib/server/orders/order-service";

const BUYER = "buyer-1";
const PRODUCER = "producer-1";
const STRANGER = "stranger-1";

async function openNegotiation() {
  return startConversation({
    offerListingId: "prod-fibra-alpaca",
    buyerActorId: BUYER,
    producerActorId: PRODUCER,
    windowHours: 24,
  });
}

describe("conversation service", () => {
  beforeEach(() => {
    resetDemoConversationStore();
    resetDemoOrderStore();
    vi.stubEnv("NODE_ENV", "test");
    vi.useRealTimers();
  });

  it("starts a conversation and lets only participants read it", async () => {
    const negotiation = await startConversation({
      offerListingId: "prod-fibra-alpaca",
      buyerActorId: BUYER,
      producerActorId: PRODUCER,
    });

    expect(negotiation.status).toBe("OPEN");
    await expect(getNegotiation(negotiation.id, BUYER)).resolves.toMatchObject({ status: "OPEN" });
    await expect(getNegotiation(negotiation.id, STRANGER)).rejects.toBeInstanceOf(
      ConversationPermissionError,
    );
  });

  it("persists messages and blocks non-participants", async () => {
    const negotiation = await openNegotiation();
    await sendMessage({ negotiationId: negotiation.id, senderActorId: BUYER, body: "Hola" });

    const messages = await listMessages(negotiation.id, PRODUCER);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ senderActorId: BUYER, body: "Hola" });

    await expect(
      sendMessage({ negotiationId: negotiation.id, senderActorId: STRANGER, body: "Hola" }),
    ).rejects.toBeInstanceOf(ConversationPermissionError);
  });

  it("moves OPEN -> COUNTERED on the first proposal and supersedes on a second", async () => {
    const negotiation = await openNegotiation();

    const first = await createProposal({
      negotiationId: negotiation.id,
      createdByActorId: PRODUCER,
      quantity: 500,
      unit: "kg",
      unitPrice: 18.5,
    });
    expect(first.status).toBe("ACTIVE");
    await expect(getNegotiation(negotiation.id, BUYER)).resolves.toMatchObject({ status: "COUNTERED" });

    const second = await createProposal({
      negotiationId: negotiation.id,
      createdByActorId: BUYER,
      quantity: 500,
      unit: "kg",
      unitPrice: 17,
    });
    expect(second.status).toBe("ACTIVE");
    // Only one active proposal at a time (S0-07 rule): the superseded one
    // is no longer a valid target to respond to.
    await expect(
      respondToProposal(negotiation.id, first.id, BUYER, "accept"),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it("accepting a proposal closes the negotiation; the author cannot self-answer", async () => {
    const negotiation = await openNegotiation();
    const proposal = await createProposal({
      negotiationId: negotiation.id,
      createdByActorId: PRODUCER,
      quantity: 500,
      unit: "kg",
      unitPrice: 18.5,
    });

    await expect(
      respondToProposal(negotiation.id, proposal.id, PRODUCER, "accept"),
    ).rejects.toBeInstanceOf(ConversationPermissionError);

    const accepted = await respondToProposal(negotiation.id, proposal.id, BUYER, "accept");
    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.orderId).toBeTruthy();

    const order = await getOrder(accepted.orderId as string, BUYER);
    expect(order).toMatchObject({
      source: "CONVERSATIONAL_PROPOSAL",
      buyerActorId: BUYER,
      status: "RESERVED",
    });
    expect(order?.items[0]).toMatchObject({
      producerActorId: PRODUCER,
      quantity: 500,
      agreedUnitPrice: 18.5,
    });

    await expect(
      sendMessage({ negotiationId: negotiation.id, senderActorId: BUYER, body: "..." }),
    ).rejects.toBeInstanceOf(ConversationTransitionError);
  });

  it("rejecting a proposal ends the negotiation", async () => {
    const negotiation = await openNegotiation();
    const proposal = await createProposal({
      negotiationId: negotiation.id,
      createdByActorId: PRODUCER,
      quantity: 500,
      unit: "kg",
      unitPrice: 18.5,
    });

    const rejected = await respondToProposal(negotiation.id, proposal.id, BUYER, "reject");
    expect(rejected.status).toBe("REJECTED");
  });

  it("expires a COUNTERED negotiation once its window has elapsed", async () => {
    vi.useFakeTimers();
    try {
      const negotiation = await startConversation({
        offerListingId: "prod-fibra-alpaca",
        buyerActorId: BUYER,
        producerActorId: PRODUCER,
        windowHours: 12,
      });
      await createProposal({
        negotiationId: negotiation.id,
        createdByActorId: PRODUCER,
        quantity: 500,
        unit: "kg",
        unitPrice: 18.5,
      });

      vi.advanceTimersByTime(12 * 60 * 60_000 + 1);

      const expired = await getNegotiation(negotiation.id, BUYER);
      expect(expired?.status).toBe("EXPIRED");
    } finally {
      vi.useRealTimers();
    }
  });

  it("only allows cancelling before any proposal is sent", async () => {
    const negotiation = await openNegotiation();
    const cancelled = await cancelConversation(negotiation.id, BUYER);
    expect(cancelled.status).toBe("CANCELLED");

    const other = await openNegotiation();
    await createProposal({
      negotiationId: other.id,
      createdByActorId: PRODUCER,
      quantity: 500,
      unit: "kg",
      unitPrice: 18.5,
    });
    await expect(cancelConversation(other.id, BUYER)).rejects.toBeInstanceOf(
      ConversationTransitionError,
    );
  });

  it("fails closed in production without a real adapter", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      startConversation({ offerListingId: "x", buyerActorId: BUYER, producerActorId: PRODUCER }),
    ).rejects.toBeInstanceOf(ConversationServerConfigurationError);
    vi.stubEnv("NODE_ENV", "test");
  });
});
