import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mock/products", () => ({
  getProductById: () => ({ quickOfferEnabled: true, minOrder: 200, quantityAvailable: 4_200 }),
}));
vi.mock("@/lib/negotiation/quick-offer", () => ({
  MAX_QUICK_OFFER_ATTEMPTS: 3,
  RESERVATION_MINUTES: 15,
}));
vi.mock("@/lib/server/negotiation/demo-private-pricing", () => ({
  getDemoPrivateFloorPrice: () => 1.35,
}));

import {
  QuickOfferServerConfigurationError,
  clearDemoQuickOfferAttempts,
  submitQuickOffer,
  type QuickOfferAdapter,
  type QuickOfferCommand,
} from "../lib/server/negotiation/quick-offer-service";

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
});
