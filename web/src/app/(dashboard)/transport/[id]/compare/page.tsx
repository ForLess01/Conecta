import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime, formatSoles } from "@/lib/format";
import { getShipment, listShipmentBids } from "@/lib/server/shipments";
import { getMyActorContext } from "@/lib/supabase/session";
import { selectBidAction } from "../actions";

export default async function CompareFreightBidsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [freight, bids, actor] = await Promise.all([getShipment(id), listShipmentBids(id), getMyActorContext()]);
  if (!freight) notFound();
  const canSelect = actor?.id === freight.requested_by_actor_id && freight.status === "OPEN_FOR_BIDS";
  return <div className="space-y-6"><DesktopTopBar title="Comparar ofertas de flete" description={`${freight.origin_label} → ${freight.destination_label} · ${bids.length} ofertas`} />
    {!bids.length ? <EmptyState icon={Users} title="Sin ofertas todavía" description="Las ofertas activas aparecerán acá." /> : <div className="grid gap-3">{bids.map((bid) => (
      <article key={bid.id} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
        <div><h2 className="font-medium">{bid.actors?.display_name ?? "Transportista"}</h2><p className="text-sm text-muted-foreground">{bid.vehicles?.display_name ?? "Vehículo"} · {bid.vehicles?.plate ?? "Sin placa"}</p><div className="mt-2 flex gap-1">{bid.helper_included && <Badge variant="secondary">Ayudante</Badge>}{bid.insurance_included && <Badge variant="secondary">Seguro</Badge>}<Badge variant="outline">{bid.status}</Badge></div></div>
        <div className="text-sm md:text-right"><p className="text-xl font-semibold">{formatSoles(Number(bid.fare_amount))}</p><p className="text-muted-foreground">{bid.departure_at ? formatDateTime(bid.departure_at) : "Salida por coordinar"} · {Math.round(Number(bid.estimated_duration_minutes ?? 0) / 60)} h</p></div>
        {canSelect && bid.status === "ACTIVE" && <form action={selectBidAction}><input type="hidden" name="bidId" value={bid.id} /><Button>Seleccionar</Button></form>}
      </article>
    ))}</div>}
  </div>;
}
