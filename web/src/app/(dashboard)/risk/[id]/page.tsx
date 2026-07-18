import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { RiskBreakdown } from "@/components/risk/risk-breakdown";
import { LocationMap } from "@/components/maps/location-map";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getVisibleRiskEvent } from "@/lib/server/risk/visible-events";
import type { RiskInfo } from "@/types/domain";

export default async function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const event = await getVisibleRiskEvent((await params).id);
  if (!event) notFound();
  const level = event.score <= 20 ? "bajo" : event.score <= 60 ? "medio" : event.score <= 80 ? "alto" : "critico";
  const risk: RiskInfo = {
    score: event.score,
    level,
    confidence: event.confidence,
    updatedAt: event.updatedAt,
    reason: event.summary ?? event.title,
    factors: [
      { label: "Tipo", detail: event.typeName },
      { label: "Severidad", detail: `${event.severity}/5` },
      { label: "Cobertura", detail: `Radio estimado de ${event.radiusKm} km` },
      { label: "Estado", detail: event.status },
    ],
    sources: event.sources,
    alternativeRouteAvailable: false,
  };
  return <div className="space-y-6"><DesktopTopBar title="Detalle de riesgo" description="El riesgo describe acceso y transporte territorial, nunca la reputación de una persona." /><div className="grid gap-6 lg:grid-cols-2"><RiskBreakdown risk={risk} /><div className="space-y-4"><LocationMap label={event.roadName ?? event.title} markers={[{ label: event.title }]} className="min-h-56" /><Card><CardContent className="space-y-2 pt-6"><div className="flex items-center justify-between"><h2 className="font-heading font-semibold">{event.title}</h2><Badge variant={event.severity >= 4 ? "destructive" : "secondary"}>{event.status}</Badge></div><p className="text-sm text-muted-foreground">{event.roadName ?? "Sin corredor específico"}</p></CardContent></Card></div></div></div>;
}
