import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const createConversationSchema = z.object({
  listingId: uuidSchema,
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(4_000),
});

export const proposalSchema = z.object({
  quantity: z.number().finite().positive().max(1_000_000_000),
  unitPrice: z.number().finite().positive().max(1_000_000_000),
  currencyCode: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  deliveryDate: z.iso.date().nullable().optional(),
  logisticsMode: z.enum(["BUYER_PICKUP", "PRODUCER_DELIVERY", "MARKETPLACE_FREIGHT"]).nullable().optional(),
  expiresAt: z.iso.datetime({ offset: true }).nullable().optional(),
  supersedesProposalId: uuidSchema.nullable().optional(),
});

export const proposalDecisionSchema = z.object({
  decision: z.enum(["accept", "reject"]),
});
