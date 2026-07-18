import Link from "next/link";
import { Route } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { listTrips } from "@/lib/server/trips";

const LABEL: Record<string, string> = { SCHEDULED: "Programado", PICKED_UP: "Recogido", IN_TRANSIT: "En tránsito", DELAYED: "Demorado", DELIVERED: "Entregado", CANCELLED: "Cancelado" };
export default async function TripsListPage() {
  const trips = await listTrips();
  return <div className="space-y-6"><DesktopTopBar title="Viajes" description="Viajes asignados, programados y en curso." />{!trips.length ? <EmptyState icon={Route} title="Sin viajes programados" description="Cuando se seleccione una oferta, el viaje aparecerá acá." /> : <div className="space-y-3">{trips.map((trip) => {
    const shipment = trip.shipment_assignments?.shipment_requests;
    return <Card key={trip.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{shipment?.cargo_description ?? "Carga sin descripción"}</p><p className="text-sm text-muted-foreground">{shipment?.origin_label} → {shipment?.destination_label}</p><Badge variant="secondary" className="mt-2">{LABEL[trip.status]}</Badge></div><Button variant="outline" asChild><Link href={`/trips/${trip.id}`}>Seguimiento</Link></Button></CardContent></Card>;
  })}</div>}</div>;
}
