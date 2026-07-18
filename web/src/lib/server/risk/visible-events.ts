import "server-only";

import { calculateRiskScore } from "@/lib/risk/score";
import { requireUser } from "@/lib/supabase/session";

export async function getVisibleRiskEvent(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("risk_events").select("*,risk_event_types(name),risk_event_evidence(headline,source_url)").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load risk event: ${error.message}`);
  if (!data) return null;
  const typeValue = Array.isArray(data.risk_event_types) ? data.risk_event_types[0] : data.risk_event_types;
  return {
    id: data.id,
    title: data.title,
    summary: data.summary,
    typeName: typeValue?.name ?? "Evento de riesgo",
    roadName: data.road_name,
    severity: Number(data.severity),
    confidence: Number(data.source_confidence),
    radiusKm: Number(data.affected_radius_km),
    status: data.status,
    updatedAt: data.updated_at,
    score: calculateRiskScore({ severity: Number(data.severity), confidence: Number(data.source_confidence), active: data.status !== "RESOLVED" }),
    sources: (data.risk_event_evidence ?? []).flatMap((item: { headline: string | null; source_url: string | null }) => item.source_url ? [{ label: item.headline ?? "Fuente citada", url: item.source_url }] : []),
  };
}
