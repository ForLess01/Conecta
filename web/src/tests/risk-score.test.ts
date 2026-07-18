import { describe, expect, it } from "vitest";
import {
  calculateCandidateConfidence,
  calculateRiskScore,
  clampScore,
  riskLevelFromScore,
} from "../lib/risk/score";

describe("risk score", () => {
  it("clamps invalid and out-of-range values to integer score bounds", () => {
    expect(clampScore(Number.NaN)).toBe(0);
    expect(clampScore(-12)).toBe(0);
    expect(clampScore(42.6)).toBe(43);
    expect(clampScore(120)).toBe(100);
  });

  it.each([
    [0, "low"],
    [20, "low"],
    [21, "medium"],
    [60, "medium"],
    [61, "high"],
    [80, "high"],
    [81, "critical"],
    [100, "critical"],
  ] as const)("maps score %i to %s at the documented thresholds", (score, expected) => {
    expect(riskLevelFromScore(score)).toBe(expected);
  });

  it("keeps evidence confidence within bounds and caps citation credit", () => {
    expect(
      calculateCandidateConfidence({
        citationCount: 100,
        hasStartAt: true,
        hasEndAt: true,
        locationSpecificity: "route",
      }),
    ).toBe(100);
    expect(
      calculateCandidateConfidence({
        citationCount: 0,
        hasStartAt: false,
        hasEndAt: false,
        locationSpecificity: "region",
        fallback: true,
      }),
    ).toBe(20);
  });

  it("bounds risk scores and applies deterministic severity and activity adjustments", () => {
    expect(calculateRiskScore({ severity: -100, confidence: -100 })).toBe(4);
    expect(calculateRiskScore({ severity: 4, confidence: 90 })).toBe(76);
    expect(calculateRiskScore({ severity: 4, confidence: 90, active: false })).toBe(64);
    expect(calculateRiskScore({ severity: 100, confidence: 100 })).toBe(96);
  });
});
