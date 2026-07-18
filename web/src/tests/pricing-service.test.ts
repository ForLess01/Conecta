import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/mock/products", () => {
  const PRODUCTS = [
    {
      id: "prod-a",
      category: "papa",
      name: "Papa A",
      priceRange: { low: 1.0, central: 1.2, high: 1.4, unit: "kg", confidence: 80, updatedAt: "2026-01-01", basis: [] },
    },
    {
      id: "prod-b",
      category: "papa",
      name: "Papa B",
      priceRange: { low: 1.2, central: 1.4, high: 1.6, unit: "kg", confidence: 60, updatedAt: "2026-01-02", basis: [] },
    },
  ];
  return {
    PRODUCTS,
    getProductById: (id: string) => PRODUCTS.find((p) => p.id === id),
  };
});

import {
  PricingServerConfigurationError,
  getSuggestedRangeForCategory,
  getSuggestedRangeForOffer,
  labelForConfidence,
} from "../lib/server/pricing/pricing-service";

describe("pricing service", () => {
  it("returns the listing's own price range for a known offer", async () => {
    const suggestion = await getSuggestedRangeForOffer("prod-a");
    expect(suggestion).toMatchObject({ low: 1.0, central: 1.2, high: 1.4, confidence: 80 });
  });

  it("returns null for an unknown offer", async () => {
    await expect(getSuggestedRangeForOffer("does-not-exist")).resolves.toBeNull();
  });

  it("averages comparable listings for a category, with a confidence penalty", async () => {
    const suggestion = await getSuggestedRangeForCategory("papa");
    expect(suggestion?.low).toBeCloseTo(1.1);
    expect(suggestion?.central).toBeCloseTo(1.3);
    expect(suggestion?.high).toBeCloseTo(1.5);
    // average confidence (70) minus the category-estimate penalty (15)
    expect(suggestion?.confidence).toBe(55);
  });

  it("returns null for a category with no comparable listings", async () => {
    await expect(getSuggestedRangeForCategory("trucha")).resolves.toBeNull();
  });

  it("labels confidence per the MVP thresholds", () => {
    expect(labelForConfidence(30)).toBe("referencia preliminar");
    expect(labelForConfidence(55)).toBe("referencia moderada");
    expect(labelForConfidence(85)).toBe("referencia sólida");
  });

  it("fails closed in production without a real adapter", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(getSuggestedRangeForOffer("prod-a")).rejects.toBeInstanceOf(
      PricingServerConfigurationError,
    );
    vi.unstubAllEnvs();
  });
});
