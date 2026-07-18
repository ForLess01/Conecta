import { describe, expect, it } from "vitest";
import {
  createConversationSchema,
  proposalDecisionSchema,
  proposalSchema,
  sendMessageSchema,
} from "../lib/server/commerce/validation";

describe("commerce request validation", () => {
  it("requires database UUIDs for conversation creation", () => {
    expect(createConversationSchema.safeParse({ listingId: "prod-papa-canchan" }).success).toBe(false);
    expect(createConversationSchema.safeParse({ listingId: "b7e3f4e2-d2f4-4ad7-b291-e5927a971145" }).success).toBe(true);
  });

  it("rejects blank or oversized messages", () => {
    expect(sendMessageSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ body: "x".repeat(4_001) }).success).toBe(false);
    expect(sendMessageSchema.parse({ body: "  hello  " }).body).toBe("hello");
  });

  it("validates proposal money, dates, logistics, and decisions", () => {
    expect(proposalSchema.safeParse({ quantity: -1, unitPrice: 2, currencyCode: "PEN" }).success).toBe(false);
    expect(proposalSchema.safeParse({
      quantity: 100,
      unitPrice: 2.5,
      currencyCode: "pen",
      deliveryDate: "2026-07-25",
      logisticsMode: "MARKETPLACE_FREIGHT",
    }).success).toBe(true);
    expect(proposalDecisionSchema.safeParse({ decision: "approve" }).success).toBe(false);
  });
});
