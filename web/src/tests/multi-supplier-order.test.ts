import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createProposal,
  respondToProposal,
  resetDemoConversationStore,
  startConversation,
} from "../lib/server/negotiation/conversation-service";
import { OrderCoverageExceededError, getOrder, getOrderCoverage, resetDemoOrderStore } from "../lib/server/orders/order-service";

const BUYER = "buyer-req-1";
const REQUEST_LISTING_ID = "req-papa-10t";

describe("S2-08: multiple producers fulfilling one requerimiento", () => {
  beforeEach(() => {
    resetDemoConversationStore();
    resetDemoOrderStore();
    vi.stubEnv("NODE_ENV", "test");
  });

  it("combines proposals from different producers into one order until the quantity is covered", async () => {
    const negotiationA = await startConversation({
      requestListingId: REQUEST_LISTING_ID,
      buyerActorId: BUYER,
      producerActorId: "producer-A",
      requiredQuantity: 10_000,
    });
    const proposalA = await createProposal({
      negotiationId: negotiationA.id,
      createdByActorId: "producer-A",
      quantity: 5_000,
      unit: "kg",
      unitPrice: 1.24,
    });
    const acceptedA = await respondToProposal(negotiationA.id, proposalA.id, BUYER, "accept");
    expect(acceptedA.orderId).toBeTruthy();

    const negotiationB = await startConversation({
      requestListingId: REQUEST_LISTING_ID,
      buyerActorId: BUYER,
      producerActorId: "producer-B",
      requiredQuantity: 10_000,
    });
    const proposalB = await createProposal({
      negotiationId: negotiationB.id,
      createdByActorId: "producer-B",
      quantity: 3_000,
      unit: "kg",
      unitPrice: 1.20,
    });
    const acceptedB = await respondToProposal(negotiationB.id, proposalB.id, BUYER, "accept");

    // Both negotiations feed the SAME order (S2-08), not two separate ones.
    expect(acceptedB.orderId).toBe(acceptedA.orderId);

    const order = await getOrder(acceptedA.orderId as string, BUYER);
    expect(order?.items).toHaveLength(2);
    expect(order?.items.map((item) => item.producerActorId).sort()).toEqual([
      "producer-A",
      "producer-B",
    ]);

    const coverage = getOrderCoverage(order!);
    expect(coverage).toMatchObject({ coveredQuantity: 8_000, requiredQuantity: 10_000, isFullyCovered: false });
  });

  it("refuses a contribution that would exceed the requested quantity", async () => {
    const negotiationA = await startConversation({
      requestListingId: REQUEST_LISTING_ID,
      buyerActorId: BUYER,
      producerActorId: "producer-A",
      requiredQuantity: 10_000,
    });
    const proposalA = await createProposal({
      negotiationId: negotiationA.id,
      createdByActorId: "producer-A",
      quantity: 8_000,
      unit: "kg",
      unitPrice: 1.24,
    });
    await respondToProposal(negotiationA.id, proposalA.id, BUYER, "accept");

    const negotiationB = await startConversation({
      requestListingId: REQUEST_LISTING_ID,
      buyerActorId: BUYER,
      producerActorId: "producer-B",
      requiredQuantity: 10_000,
    });
    const proposalB = await createProposal({
      negotiationId: negotiationB.id,
      createdByActorId: "producer-B",
      quantity: 5_000, // 8_000 + 5_000 > 10_000
      unit: "kg",
      unitPrice: 1.20,
    });

    await expect(
      respondToProposal(negotiationB.id, proposalB.id, BUYER, "accept"),
    ).rejects.toBeInstanceOf(OrderCoverageExceededError);
  });

  it("marks coverage complete once contributions reach the requested quantity", async () => {
    const negotiationA = await startConversation({
      requestListingId: REQUEST_LISTING_ID,
      buyerActorId: BUYER,
      producerActorId: "producer-A",
      requiredQuantity: 5_000,
    });
    const proposalA = await createProposal({
      negotiationId: negotiationA.id,
      createdByActorId: "producer-A",
      quantity: 5_000,
      unit: "kg",
      unitPrice: 1.24,
    });
    const accepted = await respondToProposal(negotiationA.id, proposalA.id, BUYER, "accept");
    const order = await getOrder(accepted.orderId as string, BUYER);

    expect(getOrderCoverage(order!)).toMatchObject({
      coveredQuantity: 5_000,
      requiredQuantity: 5_000,
      isFullyCovered: true,
    });
  });
});
