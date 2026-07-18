import type { RiskEvent, RiskInfo } from "@/types/domain";
import { LOCATIONS } from "./locations";

export function riskLevelFromScore(score: number): RiskInfo["level"] {
  if (score < 30) return "bajo";
  if (score < 55) return "medio";
  if (score < 80) return "alto";
  return "critico";
}

export const RISK_EVENTS: RiskEvent[] = [
  {
    id: "risk-evt-1",
    type: "protesta",
    location: LOCATIONS.ilave,
    radiusKm: 15,
    severity: 3,
    confidence: 78,
    startAt: "2026-07-17T08:00:00-05:00",
    endAt: "2026-07-19T20:00:00-05:00",
    source: "Reporte de gremio de transportistas del Collao",
    sourceUrl: "https://example.org/reporte-collao",
    status: "confirmado",
  },
  {
    id: "risk-evt-2",
    type: "lluvia",
    location: LOCATIONS.mazocruz,
    radiusKm: 25,
    severity: 2,
    confidence: 64,
    startAt: "2026-07-18T00:00:00-05:00",
    source: "SENAMHI - aviso de lluvias altiplánicas",
    sourceUrl: "https://example.org/senamhi-puno",
    status: "activo",
  },
  {
    id: "risk-evt-3",
    type: "via_restringida",
    location: LOCATIONS.juli,
    radiusKm: 8,
    severity: 2,
    confidence: 71,
    startAt: "2026-07-15T00:00:00-05:00",
    source: "Municipalidad de Juli - mantenimiento vial",
    status: "confirmado",
  },
  {
    id: "risk-evt-4",
    type: "accidente",
    location: LOCATIONS.juliaca,
    radiusKm: 5,
    severity: 3,
    confidence: 55,
    startAt: "2026-07-18T06:30:00-05:00",
    source: "Reporte ciudadano vía plataforma",
    status: "activo",
  },
];

export function makeRisk(score: number, reason: string, factors: RiskInfo["factors"], overrides?: Partial<RiskInfo>): RiskInfo {
  return {
    score,
    level: riskLevelFromScore(score),
    confidence: 72,
    updatedAt: "2026-07-18T09:00:00-05:00",
    reason,
    factors,
    sources: [
      { label: "Gremio de transportistas del Collao", url: "https://example.org/reporte-collao" },
      { label: "SENAMHI Puno", url: "https://example.org/senamhi-puno" },
    ],
    alternativeRouteAvailable: score < 80,
    estimatedDelayHours: score < 30 ? 0 : Math.round(score / 20),
    estimatedExtraCostSoles: score < 30 ? 0 : Math.round(score * 1.8),
    ...overrides,
  };
}
