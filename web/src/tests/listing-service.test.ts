import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mock/products", () => ({ PRODUCTS: [] }));
vi.mock("@/lib/mock/requests", () => ({ PURCHASE_REQUESTS: [] }));

import {
  ListingServerConfigurationError,
  ListingTransitionError,
  createListing,
  getListing,
  resetDemoListingStore,
  transitionListingStatus,
  updateListing,
  type CreateListingInput,
} from "../lib/server/marketplace/listing-service";

function offerInput(overrides: Partial<CreateListingInput> = {}): CreateListingInput {
  return {
    listingType: "OFFER",
    actorId: "producer-1",
    category: "papa",
    title: "Papa Canchán",
    quantity: 500,
    unit: "kg",
    ...overrides,
  };
}

describe("listing service CRUD", () => {
  beforeEach(() => {
    resetDemoListingStore();
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a listing and reads it back", async () => {
    const created = await createListing(offerInput());
    const fetched = await getListing(created.id);

    expect(fetched).toMatchObject({ title: "Papa Canchán", status: "ACTIVE" });
  });

  it("returns null for an unknown listing", async () => {
    await expect(getListing("does-not-exist")).resolves.toBeNull();
  });

  it("updates editable fields while ACTIVE", async () => {
    const created = await createListing(offerInput());
    const updated = await updateListing(created.id, { quantity: 300 });

    expect(updated.quantity).toBe(300);
    expect(updated.status).toBe("ACTIVE");
  });

  it("moves to SOLD_OUT when quantity reaches zero, and back to ACTIVE on replenish", async () => {
    const created = await createListing(offerInput({ quantity: 10 }));

    const soldOut = await updateListing(created.id, { quantity: 0 });
    expect(soldOut.status).toBe("SOLD_OUT");

    const replenished = await updateListing(created.id, { quantity: 50 });
    expect(replenished.status).toBe("ACTIVE");
  });

  it("rejects non-quantity edits while SOLD_OUT", async () => {
    const created = await createListing(offerInput({ quantity: 0 }));
    expect((await getListing(created.id))?.status).toBe("SOLD_OUT");

    await expect(updateListing(created.id, { title: "Nuevo título" })).rejects.toBeInstanceOf(
      ListingTransitionError,
    );
  });

  it("follows the closed state machine: pause, reactivate, close", async () => {
    const created = await createListing(offerInput());

    const paused = await transitionListingStatus(created.id, "pause");
    expect(paused.status).toBe("PAUSED");

    const reactivated = await transitionListingStatus(created.id, "reactivate");
    expect(reactivated.status).toBe("ACTIVE");

    const closed = await transitionListingStatus(created.id, "close");
    expect(closed.status).toBe("CLOSED");
  });

  it("rejects invalid transitions, including anything out of CLOSED", async () => {
    const created = await createListing(offerInput());
    await transitionListingStatus(created.id, "close");

    await expect(transitionListingStatus(created.id, "reactivate")).rejects.toBeInstanceOf(
      ListingTransitionError,
    );
    await expect(updateListing(created.id, { quantity: 10 })).rejects.toBeInstanceOf(
      ListingTransitionError,
    );
  });

  it("fails closed in production without a real adapter", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(createListing(offerInput())).rejects.toBeInstanceOf(
      ListingServerConfigurationError,
    );
  });
});
