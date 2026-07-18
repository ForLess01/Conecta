import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mock/products", () => ({
  getProductById: () => ({
    quickOfferEnabled: true,
    minOrder: 200,
    quantityAvailable: 4_200,
    producerId: "producer-1",
    unit: "kg",
  }),
}));
vi.mock("@/lib/negotiation/quick-offer", () => ({
  MAX_QUICK_OFFER_ATTEMPTS: 3,
  RESERVATION_MINUTES: 15,
}));
vi.mock("@/lib/server/negotiation/demo-private-pricing", () => ({
  getDemoPrivateFloorPrice: () => 1.35,
}));

import {
  createSubmitQuickOfferRpcAdapter,
  QuickOfferServerConfigurationError,
  clearDemoQuickOfferAttempts,
  submitQuickOffer,
  type QuickOfferAdapter,
  type QuickOfferCommand,
} from "../lib/server/negotiation/quick-offer-service";
import { getOrder, resetDemoOrderStore } from "../lib/server/orders/order-service";

function command(attemptKey: string): QuickOfferCommand {
  return {
    offerListingId: "prod-papa-canchan",
    quantity: 200,
    unitPrice: 0.01,
    currencyCode: "PEN",
    attemptKey,
  };
}

describe("quick-offer service boundaries", () => {
  beforeEach(() => {
    clearDemoQuickOfferAttempts();
    resetDemoOrderStore();
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps a process-wide per-offer ceiling across new demo identities", async () => {
    for (let index = 0; index < 12; index += 1) {
      const result = await submitQuickOffer(command(`fresh-session-${index}`));
      expect(result.status).toBe("NOT_ACCEPTED");
    }

    const limited = await submitQuickOffer(command("another-fresh-session"));
    expect(limited).toMatchObject({
      accepted: false,
      status: "RATE_LIMITED",
      attemptsRemaining: 0,
    });
  });

  it("fails closed in production without both an RPC adapter and buyer actor", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(submitQuickOffer(command("ignored"))).rejects.toBeInstanceOf(
      QuickOfferServerConfigurationError,
    );

    const adapter: QuickOfferAdapter = {
      submit: vi.fn().mockResolvedValue({
        accepted: false,
        status: "NOT_ACCEPTED",
        attemptsRemaining: 2,
        reservationExpiresAt: null,
        orderId: null,
        negotiationId: null,
      }),
    };
    await expect(submitQuickOffer(command("ignored"), adapter)).rejects.toBeInstanceOf(
      QuickOfferServerConfigurationError,
    );

    const authenticatedCommand = { ...command("ignored"), buyerActorId: "buyer-123" };
    await expect(submitQuickOffer(authenticatedCommand, adapter)).resolves.toMatchObject({
      status: "NOT_ACCEPTED",
    });
  });

  it("passes the authenticated buyer actor to the production RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      result: "AUTO_ACCEPTED",
      order_id: "order-uuid",
      negotiation_id: "negotiation-uuid",
      attempts_remaining: 2,
      reservation_expires_at: "2026-07-18T17:00:00.000Z",
    });
    const adapter = createSubmitQuickOfferRpcAdapter(rpc);

    const result = await adapter.submit({
      ...command("ignored"),
      buyerActorId: "buyer-uuid",
      unitPrice: 2,
    });

    expect(rpc).toHaveBeenCalledWith("submit_quick_offer", expect.objectContaining({
      p_buyer_actor_id: "buyer-uuid",
      p_offer_listing_id: "prod-papa-canchan",
    }));
    expect(result).toMatchObject({ accepted: true, orderId: "order-uuid" });
  });

  it("creates a real order on AUTO_ACCEPTED (S2-07)", async () => {
    const accepted = command("order-session");
    accepted.unitPrice = 2.0; // above the mocked 1.35 floor
    accepted.buyerActorId = "buyer-order-1";

    const result = await submitQuickOffer(accepted);

    expect(result.status).toBe("AUTO_ACCEPTED");
    expect(result.orderId).toBeTruthy();

    const order = await getOrder(result.orderId as string, "buyer-order-1");
    expect(order).toMatchObject({
      status: "RESERVED",
      source: "QUICK_OFFER",
      buyerActorId: "buyer-order-1",
    });
    expect(order?.items[0]).toMatchObject({
      producerActorId: "producer-1",
      quantity: 200,
      unit: "kg",
      agreedUnitPrice: 2.0,
    });
  });
});
