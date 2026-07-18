import "server-only";

import {
  calculateCandidateConfidence,
  calculateRiskScore,
  riskLevelFromScore,
} from "@/lib/risk/score";

import { isGeminiConfigured, runGroundedRiskExtraction } from "./gemini";
import {
  riskExtractionInputSchema,
  riskExtractionResultSchema,
  type GroundedCitation,
  type RawRiskCandidate,
  type RiskCandidate,
  type RiskEventType,
  type RiskExtractionInput,
  type RiskExtractionResult,
} from "./schemas";

export { extractGroundedCitations } from "./gemini";

const DEFAULT_CACHE_MINUTES = 30;

export function getRiskScanCacheTtlMs(
  env: Record<string, string | undefined> = process.env,
): number {
  const raw = env.RISK_SCAN_CACHE_MINUTES?.trim();
  if (!raw || !/^\d+$/.test(raw)) return DEFAULT_CACHE_MINUTES * 60_000;
  const minutes = Number(raw);
  return Number.isSafeInteger(minutes) && minutes >= 1 && minutes <= 1_440
    ? minutes * 60_000
    : DEFAULT_CACHE_MINUTES * 60_000;
}

interface CacheEntry {
  expiresAt: number;
  value: RiskExtractionResult;
}

const cache = new Map<string, CacheEntry>();

function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function cacheKey(input: RiskExtractionInput): string {
  return JSON.stringify({
    region: input.region.toLocaleLowerCase("es-PE"),
    province: input.province?.toLocaleLowerCase("es-PE") ?? null,
    district: input.district?.toLocaleLowerCase("es-PE") ?? null,
    route: input.route?.toLocaleLowerCase("es-PE") ?? null,
    crop: input.crop?.toLocaleLowerCase("es-PE") ?? null,
    lookbackHours: input.lookbackHours,
  });
}

function specificity(candidate: RawRiskCandidate): "region" | "province" | "district" | "route" {
  if (candidate.location.route) return "route";
  if (candidate.location.district) return "district";
  if (candidate.location.province) return "province";
  return "region";
}

export function normalizeRiskCandidate(
  raw: RawRiskCandidate,
  citations: GroundedCitation[],
  options: { fallback?: boolean } = {},
): RiskCandidate {
  const confidence = calculateCandidateConfidence({
    citationCount: citations.length,
    hasStartAt: Boolean(raw.startsAt),
    hasEndAt: Boolean(raw.endsAt),
    locationSpecificity: specificity(raw),
    fallback: options.fallback,
  });
  const riskScore = calculateRiskScore({
    severity: raw.severity,
    confidence,
  });
  const identity = [
    raw.eventType,
    raw.title,
    raw.location.region,
    raw.location.province,
    raw.location.district,
    raw.location.route,
    raw.startsAt,
  ].join("|");

  return {
    ...raw,
    id: `candidate-${stableHash(identity).toString(36)}`,
    status: "UNCONFIRMED",
    confidence,
    riskScore,
    riskLevel: riskLevelFromScore(riskScore),
    citations,
  };
}

function dedupeKey(candidate: RiskCandidate): string {
  const location = candidate.location.route
    ?? candidate.location.district
    ?? candidate.location.province
    ?? candidate.location.region;
  const day = candidate.startsAt?.slice(0, 10) ?? "unknown";
  return `${candidate.eventType}|${location}|${day}`.toLocaleLowerCase("es-PE");
}

export function dedupeRiskCandidates(candidates: RiskCandidate[]): RiskCandidate[] {
  const unique = new Map<string, RiskCandidate>();

  for (const candidate of candidates) {
    const key = dedupeKey(candidate);
    const current = unique.get(key);
    if (
      !current
      || candidate.confidence > current.confidence
      || (candidate.confidence === current.confidence && candidate.severity > current.severity)
    ) {
      unique.set(key, candidate);
    }
  }

  return [...unique.values()].sort(
    (left, right) => right.riskScore - left.riskScore || left.title.localeCompare(right.title, "es"),
  );
}

const FALLBACK_TYPES: readonly RiskEventType[] = [
  "lluvia",
  "via_restringida",
  "bloqueo",
  "accidente",
];

export function createSeededFallback(input: RiskExtractionInput): RawRiskCandidate[] {
  const seed = stableHash(cacheKey(input));
  const eventType = FALLBACK_TYPES[seed % FALLBACK_TYPES.length] ?? "via_restringida";
  const locationLabel = input.route ?? input.district ?? input.province ?? input.region;

  return [
    {
      eventType,
      title: `Monitoreo preventivo para ${locationLabel}`,
      summary:
        "Señal de respaldo sin verificación web en vivo. Requiere revisión humana antes de afectar una operación.",
      location: {
        region: input.region,
        province: input.province ?? null,
        district: input.district ?? null,
        route: input.route ?? null,
      },
      severity: ((seed % 3) + 1) as 1 | 2 | 3,
      startsAt: null,
      endsAt: null,
    },
  ];
}

function cloneResult(result: RiskExtractionResult, cached: boolean): RiskExtractionResult {
  return riskExtractionResultSchema.parse({
    ...structuredClone(result),
    cached,
  });
}

export async function extractRiskCandidates(
  request: RiskExtractionInput,
): Promise<RiskExtractionResult> {
  const input = riskExtractionInputSchema.parse(request);
  const key = cacheKey(input);
  const cachedEntry = cache.get(key);

  if (!input.force && cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cloneResult(cachedEntry.value, true);
  }

  if (cachedEntry && cachedEntry.expiresAt <= Date.now()) cache.delete(key);

  let source: RiskExtractionResult["source"] = "fallback";
  let groundedCandidates: Array<{ candidate: RawRiskCandidate; citations: GroundedCitation[] }>;

  if (isGeminiConfigured()) {
    try {
      const extracted = await runGroundedRiskExtraction(input);
      source = "gemini";
      groundedCandidates = extracted.candidates;
    } catch {
      source = "fallback";
      groundedCandidates = createSeededFallback(input).map((candidate) => ({
        candidate,
        citations: [],
      }));
    }
  } else {
    groundedCandidates = createSeededFallback(input).map((candidate) => ({
      candidate,
      citations: [],
    }));
  }

  const candidates = dedupeRiskCandidates(
    groundedCandidates.map(({ candidate, citations }) =>
      normalizeRiskCandidate(candidate, citations, { fallback: source === "fallback" }),
    ),
  );
  const citations = [...new Map(
    candidates.flatMap((candidate) => candidate.citations).map((citation) => [citation.url, citation]),
  ).values()];
  const result = riskExtractionResultSchema.parse({
    candidates,
    citations,
    source,
    cached: false,
    generatedAt: new Date().toISOString(),
  });

  cache.set(key, {
    expiresAt: Date.now() + getRiskScanCacheTtlMs(),
    value: result,
  });

  return cloneResult(result, false);
}

export function clearRiskExtractionCache(): void {
  cache.clear();
}
