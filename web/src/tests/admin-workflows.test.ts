import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { analyticsToCsv } from "../lib/server/analytics/export";
import { parsePriceCsv } from "../lib/server/pricing/csv";

describe("admin workflow helpers", () => {
  it("parses quoted price CSV values without losing commas", () => {
    const rows = parsePriceCsv([
      "product_code,market_name,observed_on,price_mid,source_code,unit_code,currency_code",
      'POTATO,"Mercado, Central",2026-07-18,2.45,OFFICIAL_MARKET,KG,PEN',
    ].join("\n"));

    expect(rows).toEqual([{
      product_code: "POTATO",
      market_name: "Mercado, Central",
      observed_on: "2026-07-18",
      price_mid: "2.45",
      source_code: "OFFICIAL_MARKET",
      unit_code: "KG",
      currency_code: "PEN",
    }]);
  });

  it("rejects CSV files that omit required catalog columns", () => {
    expect(() => parsePriceCsv("product_code,price_mid\nPOTATO,2.45")).toThrow("required columns");
  });

  it("exports operational analytics as escaped CSV", () => {
    const csv = analyticsToCsv({
      rangeDays: 30,
      generatedAt: "2026-07-18T20:00:00.000Z",
      negotiationsPerDay: 1.5,
      averageNegotiationHours: 4.2,
      completedOrders: 8,
      marketplaceTransportPercent: 75,
      averageRiskSeverity: 3.5,
      priceObservations: 14,
      topProducts: [{ name: "Papa, Canchán", quantity: 120 }],
    });

    expect(csv).toContain('"top_product:Papa, Canchán",120');
    expect(csv).toContain("marketplace_transport_percent,75");
  });
});
