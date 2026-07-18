import { z } from "zod";

export const riskEventTypeSchema = z.enum([
  "bloqueo",
  "protesta",
  "lluvia",
  "accidente",
  "via_restringida",
  "puente_danado",
]);

export const riskLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export const riskExtractionInputSchema = z
  .object({
    region: z.string().trim().min(2).max(80),
    province: z.string().trim().min(2).max(80).optional(),
    district: z.string().trim().min(2).max(80).optional(),
    route: z.string().trim().min(2).max(160).optional(),
    crop: z.string().trim().min(2).max(80).optional(),
    lookbackHours: z.number().int().min(1).max(168).default(72),
    force: z.boolean().default(false),
  })
  .strict();

export const groundedCitationSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    url: z.string().url().refine((url) => /^https?:\/\//i.test(url), {
      message: "Citation URL must use HTTP or HTTPS",
    }),
  })
  .strict();

export const riskCandidateLocationSchema = z
  .object({
    region: z.string().trim().min(2).max(80),
    province: z.string().trim().min(2).max(80).nullable(),
    district: z.string().trim().min(2).max(80).nullable(),
    route: z.string().trim().min(2).max(160).nullable(),
  })
  .strict();

/**
 * This is the only shape Gemini is allowed to generate. Source URLs are
 * intentionally absent: URLs are accepted exclusively from API annotations.
 */
export const rawRiskCandidateSchema = z
  .object({
    eventType: riskEventTypeSchema,
    title: z.string().trim().min(4).max(160),
    summary: z.string().trim().min(8).max(600),
    location: riskCandidateLocationSchema,
    severity: z.number().int().min(1).max(5),
    startsAt: z.string().datetime({ offset: true }).nullable(),
    endsAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

export const geminiRiskPayloadSchema = z
  .object({
    candidates: z.array(rawRiskCandidateSchema).max(8),
  })
  .strict();

export const riskCandidateSchema = rawRiskCandidateSchema
  .extend({
    id: z.string().min(8).max(80),
    status: z.literal("UNCONFIRMED"),
    confidence: z.number().int().min(0).max(100),
    riskScore: z.number().int().min(0).max(100),
    riskLevel: riskLevelSchema,
    citations: z.array(groundedCitationSchema).max(12),
  })
  .strict();

export const riskExtractionResultSchema = z
  .object({
    candidates: z.array(riskCandidateSchema),
    citations: z.array(groundedCitationSchema),
    source: z.enum(["gemini", "fallback"]),
    cached: z.boolean(),
    generatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type RiskEventType = z.infer<typeof riskEventTypeSchema>;
export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type RiskExtractionInput = z.infer<typeof riskExtractionInputSchema>;
export type GroundedCitation = z.infer<typeof groundedCitationSchema>;
export type RawRiskCandidate = z.infer<typeof rawRiskCandidateSchema>;
export type RiskCandidate = z.infer<typeof riskCandidateSchema>;
export type RiskExtractionResult = z.infer<typeof riskExtractionResultSchema>;
