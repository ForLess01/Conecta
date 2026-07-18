import type { RiskLevel } from "@/lib/ai/schemas";

export interface CandidateConfidenceInput {
  citationCount: number;
  hasStartAt: boolean;
  hasEndAt: boolean;
  locationSpecificity: "region" | "province" | "district" | "route";
  fallback?: boolean;
}

export interface RiskScoreInput {
  severity: number;
  confidence: number;
  active?: boolean;
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function riskLevelFromScore(score: number): RiskLevel {
  const normalized = clampScore(score);

  if (normalized <= 20) return "low";
  if (normalized <= 60) return "medium";
  if (normalized <= 80) return "high";
  return "critical";
}

/**
 * Confidence measures evidence completeness, not model self-confidence.
 * Keeping these weights fixed makes repeated runs explainable and testable.
 */
export function calculateCandidateConfidence(input: CandidateConfidenceInput): number {
  if (input.fallback) return 20;

  const locationPoints = {
    region: 5,
    province: 10,
    district: 15,
    route: 20,
  }[input.locationSpecificity];

  const citationPoints = Math.min(3, Math.max(0, input.citationCount)) * 15;
  const timePoints = (input.hasStartAt ? 15 : 0) + (input.hasEndAt ? 5 : 0);

  return clampScore(20 + locationPoints + citationPoints + timePoints);
}

/** Severity drives impact; grounded confidence only adjusts certainty. */
export function calculateRiskScore(input: RiskScoreInput): number {
  const severity = Math.min(5, Math.max(1, Math.round(input.severity)));
  const confidence = clampScore(input.confidence);
  const severityPoints = [0, 12, 30, 50, 70, 88][severity] ?? 0;
  const confidenceAdjustment = Math.round((confidence - 50) * 0.16);
  const activeAdjustment = input.active === false ? -12 : 0;

  return clampScore(severityPoints + confidenceAdjustment + activeAdjustment);
}
