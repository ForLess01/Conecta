import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Check, Circle } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TripRouteMap } from "@/components/maps/trip-route-map";
import { formatDateTime } from "@/lib/format";
import { getTrip } from "@/lib/server/trips";
import { getMyActorContext } from "@/lib/supabase/session";
import { transitionTripAction } from "./actions";

const LABEL: Record<string, string> = { SCHEDULED: "Programado", PICKED_UP: "Recogido", IN_TRANSIT: "En tránsito", DELAYED: "Demorado", DELIVERED: "Entregado", CANCELLED: "Cancelado" };
const NEXT: Record<string, { status: string; label: string }[]> = { PICKED_UP: [{ status: "IN_TRANSIT", label: "Iniciar ruta" }], IN_TRANSIT: [{ status: "DELAYED", label: "Marcar demora" }], DELAYED: [{ status: "IN_TRANSIT", label: "Reanudar ruta" }] };

export default async function TripTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const [{ trip, history, records, incidents, evidence }, actor] = await Promise.all([getTrip(id), getMyActorContext()]); if (!trip) notFound();
  const shipment = trip.shipment_assignments?.shipment_requests; const bid = trip.shipment_assignments?.freight_bids;
  const managesTrip = actor?.id === bid?.transporter_actor_id;
  return <div className="space-y-6"><DesktopTopBar title="Seguimiento del viaje" description={shipment?.cargo_description ?? `Viaje ${id.slice(0, 8)}`} />
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]"><div className="space-y-4">
      {shipment?.origin_label && shipment.destination_label && <TripRouteMap origin={shipment.origin_label} destination={shipment.destination_label} />}
      <Card><CardContent className="space-y-4 pt-6"><div className="flex justify-between"><h2 className="font-heading font-semibold">Línea de tiempo</h2><Badge>{LABEL[trip.status]}</Badge></div><ol className="space-y-3">{history.map((event) => <li key={event.id} className="flex gap-3"><Check className="mt-0.5 size-4 text-primary" /><div><p className="text-sm font-medium">{LABEL[event.status] ?? event.status}</p><p className="text-xs text-muted-foreground">{formatDateTime(event.created_at)}{event.notes ? ` · ${event.notes}` : ""}</p></div></li>)}{trip.status !== "DELIVERED" && <li className="flex gap-3 text-muted-foreground"><Circle className="size-4" /> Entregado</li>}</ol></CardContent></Card>
      {(records.length > 0 || evidence.length > 0) && <Card><CardContent className="space-y-3 pt-6"><h2 className="font-heading font-semibold">Registros y evidencia</h2>{records.map((record) => <p key={record.id} className="rounded-xl bg-muted p-3 text-sm"><strong>{record.record_type === "PICKUP" ? "Recojo" : "Entrega"}</strong> · {record.recorded_weight_kg} kg · {formatDateTime(record.recorded_at)}</p>)}{evidence.map((item) => <p key={item.id} className="text-sm text-muted-foreground">Archivo: {item.original_filename ?? item.evidence_type} · {formatDateTime(item.captured_at)}</p>)}</CardContent></Card>}
      {incidents.length > 0 && <Card><CardContent className="space-y-3 pt-6"><h2 className="flex items-center gap-2 font-heading font-semibold"><AlertTriangle className="size-4 text-destructive" /> Incidencias</h2>{incidents.map((incident) => <div key={incident.id} className="rounded-xl border p-3"><p className="text-sm font-medium">{incident.incident_type}</p><p className="text-sm text-muted-foreground">{incident.description}</p></div>)}</CardContent></Card>}
    </div><div className="space-y-4"><Card><CardContent className="space-y-3 pt-6"><p className="text-xs text-muted-foreground">Conductor y vehículo</p><p className="font-medium">{bid?.actors?.display_name ?? "Transportista"}</p><p className="text-sm text-muted-foreground">{bid?.vehicles?.display_name ?? "Vehículo"} · {bid?.vehicles?.plate ?? "Sin placa"}</p></CardContent></Card>
      {managesTrip && <Card><CardContent className="space-y-2 pt-6">{(NEXT[trip.status] ?? []).map((next) => <form action={transitionTripAction} key={next.status}><input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="status" value={next.status} /><Button className="w-full">{next.label}</Button></form>)}
        {trip.status === "SCHEDULED" && <Button variant="outline" asChild className="w-full"><Link href={`/trips/${trip.id}/pickup`}>Registrar recojo</Link></Button>}
        {["IN_TRANSIT", "DELAYED"].includes(trip.status) && <Button variant="outline" asChild className="w-full"><Link href={`/trips/${trip.id}/delivery`}>Registrar entrega</Link></Button>}
        {!['DELIVERED','CANCELLED'].includes(trip.status) && <Button variant="ghost" asChild className="w-full"><Link href={`/trips/${trip.id}/incident`}>Reportar incidencia</Link></Button>}
      </CardContent></Card>}
    </div></div>
  </div>;
}
