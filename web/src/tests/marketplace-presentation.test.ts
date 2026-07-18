import { describe, expect, it } from "vitest";
import { getCatalogProductId, getDefaultProductImage } from "../lib/marketplace/catalog";
import { buildOpenStreetMapEmbedUrl } from "../lib/maps/openstreetmap";

describe("marketplace presentation data", () => {
  it.each([
    ["POTATO", "CANCHAN", "prod-papa-canchan"],
    ["POTATO", "IMILLA_NEGRA", "prod-papa-imilla"],
    ["ALPACA_FIBER", null, "prod-fibra-alpaca"],
    ["QUINOA", null, "prod-quinua"],
    ["ONION", null, "prod-cebolla"],
    ["TROUT", null, "prod-trucha"],
  ])("maps %s/%s to its stable catalog image", (productCode, varietyCode, expectedId) => {
    expect(getCatalogProductId(productCode, varietyCode)).toBe(expectedId);
    expect(getDefaultProductImage(productCode, varietyCode)).toMatch(/^\/images\/.+\.jpg$/);
  });

  it("builds an OpenStreetMap embed with an approximate marker", () => {
    const url = new URL(buildOpenStreetMapEmbedUrl({ latitude: -16.23, longitude: -69.77 }));
    expect(url.hostname).toBe("www.openstreetmap.org");
    expect(url.searchParams.get("marker")).toBe("-16.23,-69.77");
    expect(url.searchParams.get("layer")).toBe("mapnik");
  });
});
