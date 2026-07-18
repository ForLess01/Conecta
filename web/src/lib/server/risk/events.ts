import "server-only";

import { createHash } from "node:crypto";
import { getGeminiRuntimeConfig } from "@/lib/ai/gemini";
import type { GroundedCitation, RiskCandidate, RiskExtractionResult } from "@/lib/ai/schemas";
import { getAdminContext } from "@/lib/server/admin/auth";
import type { Database } from "@/lib/supabase/types.gen";

const EVENT_TYPE_CODES: Record<RiskCandidate["eventType"], string> = {
  bloqueo: "ROAD_BLOCK",
  protesta: "PROTEST",
  lluvia: "HEAVY_RAIN",
  accidente: "ACCIDENT",
  via_restringida: "ACCESS_DIFFICULTY",
  puente_danado: "ROAD_DAMAGE",
};

export interface RiskEventInput {
  eventTypeCode: string;
  title: string;
  summary?: string | null;
  roadName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  affectedRadiusKm: number;
  severity: number;
  sourceConfidence: number;
  status?: Database["public"]["Enums"]["risk_event_status"];
  startsAt?: string | null;
  endsAt?: string | null;
  sourceUrl?: string | null;
}

export interface RiskEventRecord {
  id: string;
  typeCode: string;
  typeName: string;
  title: string;
  summary: string | null;
  roadName: string | null;
  severity: number;
  confidence: number;
  status: string;
  radiusKm: number;
  startsAt: string | null;
  endsAt: string | null;
  updatedAt: string;
  citations: GroundedCitation[];
}

export interface PersistedCandidate extends RiskCandidate {
  runId: string;
}

export async function listRiskEvents(): Promise<RiskEventRecord[]> {
  const { supabase } = await getAdminContext();
  return queryRiskEvents(supabase);
}

export async function getRiskEvent(id: string): Promise<RiskEventRecord | null> {
  const { supabase } = await getAdminContext();
  const events = await queryRiskEvents(supabase, id);
  return events[0] ?? null;
}

export async function listRiskCandidates(): Promise<PersistedCandidate[]> {
  const { supabase } = await getAdminContext();
  const { data, error } = await supabase
    .from("analysis_risk_candidates")
    .select("*,analysis_candidate_citations(title,source_url)")
    .eq("status", "UNCONFIRMED")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Could not load risk candidates: ${error.message}`);
  return (data ?? []).map(candidateFromRow);
}

export async function persistRiskAnalysis(
  input: unknown,
  results: RiskExtractionResult[],
  candidates: RiskCandidate[],
): Promise<{ runId: string; candidates: PersistedCandidate[] }> {
  const { supabase, userId } = await getAdminContext();
  const usesGemini = results.some((result) => result.source === "gemini");
  const model = usesGemini ? getGeminiRuntimeConfig().model : null;
  const inputHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const { data: run, error: runError } = await supabase.from("analysis_runs").insert({
    provider: usesGemini ? "GEMINI" : "RULE_ENGINE",
    model_name: model,
    analysis_type: "RURAL_LOGISTICS_RISK_SCAN",
    input_hash: inputHash,
    status: "RUNNING",
    started_at: new Date().toISOString(),
    created_by: userId,
  }).select("id").single();
  if (runError) throw new Error(`Could not persist analysis run: ${runError.message}`);

  try {
    if (candidates.length > 0) {
      const { data: inserted, error: candidateError } = await supabase
        .from("analysis_risk_candidates")
        .insert(candidates.map((candidate) => ({
          analysis_run_id: run.id,
          external_key: candidate.id,
          event_type_code: EVENT_TYPE_CODES[candidate.eventType],
          title: candidate.title,
          summary: candidate.summary,
          region: candidate.location.region,
          province: candidate.location.province,
          district: candidate.location.district,
          road_name: candidate.location.route,
          severity: candidate.severity,
          source_confidence: candidate.confidence,
          risk_score: candidate.riskScore,
          starts_at: candidate.startsAt,
          ends_at: candidate.endsAt,
        })))
        .select("id,external_key");
      if (candidateError) throw candidateError;

      const ids = new Map((inserted ?? []).map((row) => [row.external_key, row.id]));
      const citations = candidates.flatMap((candidate) => {
        const candidateId = ids.get(candidate.id);
        if (!candidateId) throw new Error(`Could not resolve persisted candidate: ${candidate.id}`);
        return candidate.citations.map((citation) => ({
          candidate_id: candidateId,
          title: citation.title,
          source_url: citation.url,
        }));
      });
      if (citations.length > 0) {
        const { error } = await supabase.from("analysis_candidate_citations").insert(citations);
        if (error) throw error;
      }
    }

    const { error: completionError } = await supabase.from("analysis_runs").update({
      status: "SUCCEEDED",
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
    if (completionError) throw completionError;
  } catch (error) {
    await supabase.from("analysis_runs").update({
      status: "FAILED",
      completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message.slice(0, 1_000) : "Persistence failed",
    }).eq("id", run.id);
    throw new Error(`Could not persist analysis candidates: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  const persisted = await listRiskCandidatesForRun(supabase, run.id);
  return { runId: run.id, candidates: persisted };
}

export async function confirmRiskCandidate(id: string): Promise<string> {
  const { supabase } = await getAdminContext();
  const { data, error } = await supabase.rpc("confirm_risk_candidate", { p_candidate_id: id });
  if (error) throw new Error(`Could not confirm risk candidate: ${error.message}`);
  return String(data);
}

export async function discardRiskCandidate(id: string): Promise<void> {
  const { supabase, userId } = await getAdminContext();
  const { data, error } = await supabase.from("analysis_risk_candidates").update({
    status: "DISCARDED",
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id).eq("status", "UNCONFIRMED").select("id").maybeSingle();
  if (error) throw new Error(`Could not discard risk candidate: ${error.message}`);
  if (!data) throw new Error("Risk candidate is not pending.");
}

export async function createRiskEvent(input: RiskEventInput): Promise<string> {
  const { supabase } = await getAdminContext();
  const { data, error } = await supabase.rpc("create_risk_event_with_evidence", {
    p_payload: {
      eventTypeCode: input.eventTypeCode,
      title: input.title,
      summary: input.summary ?? "",
      roadName: input.roadName ?? "",
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      affectedRadiusKm: input.affectedRadiusKm,
      severity: input.severity,
      sourceConfidence: input.sourceConfidence,
      status: input.status ?? "CONFIRMED",
      startsAt: input.startsAt ?? "",
      endsAt: input.endsAt ?? "",
      sourceUrl: input.sourceUrl ?? "",
    },
  });
  if (error) throw new Error(`Could not create risk event: ${error.message}`);
  return String(data);
}

export async function updateRiskEvent(id: string, input: Partial<RiskEventInput>): Promise<void> {
  const { supabase, userId } = await getAdminContext();
  const eventTypeId = input.eventTypeCode ? await resolveEventType(supabase, input.eventTypeCode) : undefined;
  const { error } = await supabase.from("risk_events").update({
    ...(eventTypeId !== undefined && { event_type_id: eventTypeId }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.summary !== undefined && { summary: input.summary }),
    ...(input.roadName !== undefined && { road_name: input.roadName }),
    ...(input.latitude !== undefined && { latitude: input.latitude }),
    ...(input.longitude !== undefined && { longitude: input.longitude }),
    ...(input.affectedRadiusKm !== undefined && { affected_radius_km: input.affectedRadiusKm }),
    ...(input.severity !== undefined && { severity: input.severity }),
    ...(input.sourceConfidence !== undefined && { source_confidence: input.sourceConfidence }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.startsAt !== undefined && { starts_at: input.startsAt }),
    ...(input.endsAt !== undefined && { ends_at: input.endsAt }),
  }).eq("id", id);
  if (error) throw new Error(`Could not update risk event: ${error.message}`);
  await supabase.from("audit_logs").insert({ user_id: userId, action: "RISK_EVENT_UPDATED", entity_table: "risk_events", entity_id: id });
}

export async function deleteRiskEvent(id: string): Promise<void> {
  const { supabase, userId } = await getAdminContext();
  const { error } = await supabase.from("risk_events").delete().eq("id", id);
  if (error) throw new Error(`Could not delete risk event: ${error.message}`);
  await supabase.from("audit_logs").insert({ user_id: userId, action: "RISK_EVENT_DELETED", entity_table: "risk_events", entity_id: id });
}

async function queryRiskEvents(supabase: Awaited<ReturnType<typeof getAdminContext>>["supabase"], id?: string) {
  let query = supabase.from("risk_events").select("*,risk_event_types(code,name),risk_event_evidence(headline,source_url)").order("updated_at", { ascending: false });
  if (id) query = query.eq("id", id);
  const { data, error } = await query.limit(id ? 1 : 200);
  if (error) throw new Error(`Could not load risk events: ${error.message}`);
  return (data ?? []).map((row) => {
    const type = relation(row.risk_event_types);
    return {
      id: row.id,
      typeCode: String(type?.code ?? "UNKNOWN"),
      typeName: String(type?.name ?? "Evento"),
      title: row.title,
      summary: row.summary,
      roadName: row.road_name,
      severity: Number(row.severity),
      confidence: Number(row.source_confidence),
      status: row.status,
      radiusKm: Number(row.affected_radius_km),
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      updatedAt: row.updated_at,
      citations: (row.risk_event_evidence ?? []).flatMap((item: { headline: string | null; source_url: string | null }) => item.source_url ? [{ title: item.headline ?? "Fuente", url: item.source_url }] : []),
    } satisfies RiskEventRecord;
  });
}

async function listRiskCandidatesForRun(supabase: Awaited<ReturnType<typeof getAdminContext>>["supabase"], runId: string) {
  const { data, error } = await supabase.from("analysis_risk_candidates").select("*,analysis_candidate_citations(title,source_url)").eq("analysis_run_id", runId);
  if (error) throw new Error(`Could not reload persisted candidates: ${error.message}`);
  return (data ?? []).map(candidateFromRow);
}

function candidateFromRow(row: Record<string, unknown>): PersistedCandidate {
  const eventType = Object.entries(EVENT_TYPE_CODES).find(([, code]) => code === row.event_type_code)?.[0] as RiskCandidate["eventType"] | undefined;
  if (!eventType) throw new Error(`Unsupported persisted event type: ${String(row.event_type_code)}`);
  return {
    id: String(row.id),
    runId: String(row.analysis_run_id),
    eventType,
    title: String(row.title),
    summary: String(row.summary),
    location: {
      region: String(row.region),
      province: nullableString(row.province),
      district: nullableString(row.district),
      route: nullableString(row.road_name),
    },
    severity: Number(row.severity),
    startsAt: nullableString(row.starts_at),
    endsAt: nullableString(row.ends_at),
    status: "UNCONFIRMED",
    confidence: Number(row.source_confidence),
    riskScore: Number(row.risk_score),
    riskLevel: riskLevel(Number(row.risk_score)),
    citations: ((row.analysis_candidate_citations as Array<{ title: string; source_url: string }> | undefined) ?? []).map((citation) => ({ title: citation.title, url: citation.source_url })),
  };
}

async function resolveEventType(supabase: Awaited<ReturnType<typeof getAdminContext>>["supabase"], code: string) {
  const { data, error } = await supabase.from("risk_event_types").select("id").eq("code", code).maybeSingle();
  if (error || !data) throw new Error(`Unknown risk event type: ${code}`);
  return data.id as number;
}

function relation(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined) ?? null;
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function nullableString(value: unknown) {
  return value === null || value === undefined ? null : String(value);
}

function riskLevel(score: number): RiskCandidate["riskLevel"] {
  if (score <= 20) return "low";
  if (score <= 60) return "medium";
  if (score <= 80) return "high";
  return "critical";
}
