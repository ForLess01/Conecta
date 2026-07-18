import Link from "next/link";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { LocationMap } from "@/components/maps/location-map";
import { AiRiskScanPanel } from "@/components/admin/ai-risk-scan-panel";
import { RiskEventsTable } from "@/components/admin/risk-events-table";
import { listRiskCandidates, listRiskEvents } from "@/lib/server/risk/events";

export default async function AdminRiskEventsPage() {
  const [events, candidates] = await Promise.all([listRiskEvents(), listRiskCandidates()]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DesktopTopBar title="Gestión de eventos de riesgo" description="Eventos que alimentan el motor de riesgo territorial." />
        <Button asChild>
          <Link href="/admin/risk-events/new">Crear evento</Link>
        </Button>
      </div>

      <LocationMap
        label="Todos los eventos de riesgo"
        markers={events.map((event) => ({ label: `${event.typeName} · ${event.roadName ?? event.title}` }))}
      />

      <AiRiskScanPanel initialCandidates={candidates} />
      <RiskEventsTable events={events} />
    </div>
  );
}
