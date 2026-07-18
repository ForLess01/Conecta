import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/risk/score", async () => import("../lib/risk/score"));
const geminiMocks = vi.hoisted(() => ({
  runGroundedRiskExtraction: vi.fn(),
}));
vi.mock("../lib/ai/gemini", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/ai/gemini")>();
  return { ...actual, runGroundedRiskExtraction: geminiMocks.runGroundedRiskExtraction };
});

import {
  clearRiskExtractionCache,
  dedupeRiskCandidates,
  extractRiskCandidates,
  extractGroundedCitations,
  getRiskScanCacheTtlMs,
  normalizeRiskCandidate,
} from "../lib/ai/risk-extraction";
import {
  attributeGroundedCitations,
  getGeminiRuntimeConfig,
  selectGroundedCandidates,
} from "../lib/ai/gemini";
import { rawRiskCandidateSchema, type GroundedCitation, type RawRiskCandidate } from "../lib/ai/schemas";

const baseCandidate: RawRiskCandidate = {
  eventType: "bloqueo",
  title: "Bloqueo parcial en la ruta",
  summary: "El transito permanece restringido en un tramo de la ruta.",
  location: {
    region: "Puno",
    province: "El Collao",
    district: "Ilave",
    route: "Ilave - Juliaca",
  },
  severity: 4,
  startsAt: "2026-07-18T10:00:00-05:00",
  endsAt: "2026-07-19T10:00:00-05:00",
};

const citations: GroundedCitation[] = [
  { title: "Regional road report", url: "https://news.example/risk-1" },
  { title: "Transport authority", url: "https://authority.example/risk-1" },
];
const originalGeminiApiKey = process.env.GEMINI_API_KEY;

describe("risk extraction helpers", () => {
  beforeEach(() => {
    clearRiskExtractionCache();
    geminiMocks.runGroundedRiskExtraction.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T18:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalGeminiApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGeminiApiKey;
  });

  it("normalizes an extracted candidate into an explainable unconfirmed event", () => {
    const normalized = normalizeRiskCandidate(baseCandidate, citations);

    expect(normalized).toMatchObject({
      eventType: "bloqueo",
      status: "UNCONFIRMED",
      confidence: 90,
      riskScore: 76,
      riskLevel: "high",
      citations,
    });
    expect(normalized.id).toMatch(/^candidate-/);
    expect(normalizeRiskCandidate(baseCandidate, citations).id).toBe(normalized.id);
  });

  it("deduplicates the same event and retains the strongest grounded candidate", () => {
    const weaker = normalizeRiskCandidate(
      { ...baseCandidate, title: "Primer reporte de bloqueo" },
      citations.slice(0, 1),
    );
    const stronger = normalizeRiskCandidate(
      { ...baseCandidate, title: "Segundo reporte de bloqueo" },
      citations,
    );

    const result = dedupeRiskCandidates([weaker, stronger]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Segundo reporte de bloqueo");
    expect(result[0].confidence).toBeGreaterThan(weaker.confidence);
  });

  it("accepts citations only from valid model-output annotations and deduplicates URLs", () => {
    const response = {
      output_text: JSON.stringify({
        candidates: [{ ...baseCandidate, sourceUrls: ["https://invented.example/claim"] }],
      }),
      steps: [
        {
          type: "model_output",
          content: [
            {
              type: "text",
              annotations: [
                { type: "url_citation", title: "Road report", url: "https://news.example/risk" },
                { type: "url_citation", title: "Duplicate", url: "https://news.example/risk" },
                { type: "url_citation", title: "Unsafe", url: "javascript:alert(1)" },
                { type: "unsupported", title: "Ignored", url: "https://ignored.example" },
              ],
            },
          ],
        },
        {
          type: "tool_output",
          content: [
            {
              type: "text",
              annotations: [
                { type: "url_citation", title: "Not grounded", url: "https://ungrounded.example" },
              ],
            },
          ],
        },
      ],
    };

    expect(extractGroundedCitations(response)).toEqual([
      { title: "Duplicate", url: "https://news.example/risk" },
    ]);
  });

  it("rejects model-authored URL fields from the structured candidate schema", () => {
    expect(
      rawRiskCandidateSchema.safeParse({
        ...baseCandidate,
        sourceUrls: ["https://invented.example/claim"],
      }).success,
    ).toBe(false);
  });

  it("attributes disjoint citations only to the candidate JSON span they overlap", () => {
    const secondCandidate: RawRiskCandidate = {
      ...baseCandidate,
      eventType: "lluvia",
      title: "Lluvia intensa en Ácora",
      summary: "Lluvia intensa afecta una vía vecinal diferente.",
      location: {
        region: "Puno",
        province: "Puno",
        district: "Ácora",
        route: "Ácora - Platería",
      },
    };
    const outputText = JSON.stringify({ candidates: [baseCandidate, secondCandidate] });
    const firstStart = Buffer.byteLength(outputText.slice(0, outputText.indexOf(baseCandidate.title)));
    const secondStart = Buffer.byteLength(outputText.slice(0, outputText.indexOf(secondCandidate.title)));
    const response = {
      steps: [{
        type: "model_output",
        content: [{
          type: "text",
          text: outputText,
          annotations: [
            {
              type: "url_citation",
              title: "First event source",
              url: "https://first.example/report",
              start_index: firstStart,
              end_index: firstStart + Buffer.byteLength(baseCandidate.title),
            },
            {
              type: "url_citation",
              title: "Second event source",
              url: "https://second.example/report",
              start_index: secondStart,
              end_index: secondStart + Buffer.byteLength(secondCandidate.title),
            },
          ],
        }],
      }],
    };

    const attributed = attributeGroundedCitations(response, outputText, 2);
    const grounded = selectGroundedCandidates([baseCandidate, secondCandidate], attributed);
    const normalized = grounded.map(({ candidate, citations: candidateCitations }) =>
      normalizeRiskCandidate(candidate, candidateCitations),
    );

    expect(normalized).toHaveLength(2);
    expect(normalized[0].citations.map((citation) => citation.url)).toEqual([
      "https://first.example/report",
    ]);
    expect(normalized[1].citations.map((citation) => citation.url)).toEqual([
      "https://second.example/report",
    ]);
    expect(normalized[0].confidence).toBe(75);
    expect(normalized[1].confidence).toBe(75);
  });

  it("drops a Gemini candidate without an attributable citation", () => {
    expect(selectGroundedCandidates([baseCandidate], [[]])).toEqual([]);
  });

  it("uses validated bounded AI runtime environment values", () => {
    expect(getGeminiRuntimeConfig({
      GEMINI_MODEL: "gemini-custom-1",
      GEMINI_TIMEOUT_MS: "4500",
    })).toEqual({ model: "gemini-custom-1", timeoutMs: 4500 });
    expect(getGeminiRuntimeConfig({
      GEMINI_MODEL: "invalid model name",
      GEMINI_TIMEOUT_MS: "999999",
    })).toEqual({ model: "gemini-3.5-flash", timeoutMs: 12_000 });
    expect(getRiskScanCacheTtlMs({ RISK_SCAN_CACHE_MINUTES: "45" })).toBe(45 * 60_000);
    expect(getRiskScanCacheTtlMs({ RISK_SCAN_CACHE_MINUTES: "0" })).toBe(30 * 60_000);
  });

  it("does not invent risk candidates when configured Gemini rejects", async () => {
    process.env.GEMINI_API_KEY = "configured-test-key";
    geminiMocks.runGroundedRiskExtraction.mockRejectedValueOnce(new Error("Gemini unavailable"));

    const result = await extractRiskCandidates({
      region: "Puno",
      province: "El Collao",
      district: "Ilave",
      route: "Ilave - Juliaca",
      crop: "potato",
      lookbackHours: 72,
      force: true,
    });

    expect(geminiMocks.runGroundedRiskExtraction).toHaveBeenCalledOnce();
    expect(result.source).toBe("fallback");
    expect(result.candidates).toEqual([]);
    expect(result.citations).toEqual([]);
  });
});
