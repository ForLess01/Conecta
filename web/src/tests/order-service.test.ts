import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  OrderAlreadyExistsError,
  OrderPermissionError,
  OrderServerConfigurationError,
  createOrderFromAcceptedProposal,
  createOrderFromQuickOffer,
  getOrder,
  resetDemoOrderStore,
} from "../lib/server/orders/order-service";

describe("order service", () => {
  beforeEach(() => {
    resetDemoOrderStore();
    vi.stubEnv("NODE_ENV", "test");
  });

  it("creates the same order/item shape from a quick offer and from an accepted proposal", async () => {
    const fromQuickOffer = await createOrderFromQuickOffer({
      buyerActorId: "buyer-1",
      producerActorId: "producer-1",
      offerListingId: "prod-papa-canchan",
      quantity: 200,
      unit: "kg",
      unitPrice: 1.4,
      reservationExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    });

    const fromProposal = await createOrderFromAcceptedProposal({
      buyerActorId: "buyer-2",
      producerActorId: "producer-2",
      offerListingId: "prod-fibra-alpaca",
      quantity: 500,
      unit: "kg",
      unitPrice: 18.5,
      negotiationId: "neg-1",
    });

    expect(Object.keys(fromQuickOffer).sort()).toEqual(Object.keys(fromProposal).sort());
    expect(Object.keys(fromQuickOffer.items[0]).sort()).toEqual(
      Object.keys(fromProposal.items[0]).sort(),
    );
    expect(fromQuickOffer.status).toBe("RESERVED");
    expect(fromProposal.status).toBe("RESERVED");
    expect(fromQuickOffer.source).toBe("QUICK_OFFER");
    expect(fromProposal.source).toBe("CONVERSATIONAL_PROPOSAL");
  });

  it("lets the buyer and the producer read the order, but no one else", async () => {
    const order = await createOrderFromQuickOffer({
      buyerActorId: "buyer-1",
      producerActorId: "producer-1",
      offerListingId: "prod-papa-canchan",
      quantity: 200,
      unit: "kg",
      unitPrice: 1.4,
      reservationExpiresAt: new Date().toISOString(),
    });

    await expect(getOrder(order.id, "buyer-1")).resolves.toMatchObject({ id: order.id });
    await expect(getOrder(order.id, "producer-1")).resolves.toMatchObject({ id: order.id });
    await expect(getOrder(order.id, "stranger")).rejects.toBeInstanceOf(OrderPermissionError);
  });

  it("returns null for an unknown order", async () => {
    await expect(getOrder("does-not-exist", "buyer-1")).resolves.toBeNull();
  });

  it("refuses a second order for the same negotiation", async () => {
    await createOrderFromAcceptedProposal({
      buyerActorId: "buyer-1",
      producerActorId: "producer-1",
      offerListingId: "prod-papa-canchan",
      quantity: 100,
      unit: "kg",
      unitPrice: 1.4,
      negotiationId: "neg-dup",
    });

    await expect(
      createOrderFromAcceptedProposal({
        buyerActorId: "buyer-1",
        producerActorId: "producer-1",
        offerListingId: "prod-papa-canchan",
        quantity: 100,
        unit: "kg",
        unitPrice: 1.4,
        negotiationId: "neg-dup",
      }),
    ).rejects.toBeInstanceOf(OrderAlreadyExistsError);
  });

  it("fails closed in production without a real adapter", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      createOrderFromQuickOffer({
        buyerActorId: "buyer-1",
        producerActorId: "producer-1",
        offerListingId: "prod-papa-canchan",
        quantity: 100,
        unit: "kg",
        unitPrice: 1.4,
        reservationExpiresAt: new Date().toISOString(),
      }),
    ).rejects.toBeInstanceOf(OrderServerConfigurationError);
  });
});
