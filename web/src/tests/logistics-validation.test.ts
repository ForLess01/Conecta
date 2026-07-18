import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/session", () => ({ getMyActorContext: vi.fn() }));

import { freightBidSchema, shipmentDraftSchema } from "../lib/server/shipments";
import { incidentSchema, operationRecordSchema, tripTransitionSchema } from "../lib/server/trips";
import { vehicleSchema } from "../lib/server/vehicles";

const UUID = "10000000-0000-4000-8000-000000000001";

describe("logistics command validation", () => {
  it("accepts a complete marketplace shipment draft", () => {
    expect(shipmentDraftSchema.parse({
      orderId: UUID,
      mode: "MARKETPLACE_FREIGHT",
      weightKg: "4200",
      packageCount: "84",
      needsHelper: true,
    })).toMatchObject({ weightKg: 4200, packageCount: 84 });
  });

  it("rejects non-positive freight bids", () => {
    expect(() => freightBidSchema.parse({
      shipmentId: UUID,
      vehicleId: UUID,
      fare: 0,
      departureAt: "2026-07-21T05:00",
      durationMinutes: 240,
    })).toThrow();
  });

  it("normalizes vehicle capacity and rejects malformed plates", () => {
    expect(vehicleSchema.parse({
      displayName: "Camión principal",
      plate: "Z9X-321",
      vehicleTypeCode: "MEDIUM_TRUCK",
      capacityKg: "8000",
      capacityM3: "32",
    }).capacityKg).toBe(8000);
    expect(() => vehicleSchema.parse({
      displayName: "Camión principal",
      plate: "unsafe plate!",
      vehicleTypeCode: "MEDIUM_TRUCK",
      capacityKg: 8000,
      capacityM3: 32,
    })).toThrow();
  });

  it("requires accepted quantity for delivery records", () => {
    expect(() => operationRecordSchema.parse({
      tripId: UUID,
      recordType: "DELIVERY",
      weightKg: 4000,
      packageCount: null,
      acceptedQuantity: null,
      observedQuantity: 0,
      confirmed: true,
    })).toThrow("Accepted quantity is required for delivery");
  });

  it("allows only supported trip transitions and incident types", () => {
    expect(tripTransitionSchema.parse({ tripId: UUID, status: "IN_TRANSIT" }).status).toBe("IN_TRANSIT");
    expect(incidentSchema.parse({ tripId: UUID, incidentType: "ROAD_BLOCK", description: "Bloqueo en el kilómetro 12" }).incidentType).toBe("ROAD_BLOCK");
    expect(() => incidentSchema.parse({ tripId: UUID, incidentType: "UNKNOWN", description: "No válido" })).toThrow();
  });
});
