import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getTrip } from "@/lib/server/trips";
import { incidentAction } from "../actions";

const TYPES = [["DELAY", "Retraso"], ["ROAD_BLOCK", "Vía bloqueada"], ["BREAKDOWN", "Avería"], ["WEIGHT_DIFFERENCE", "Diferencia de peso"], ["DAMAGE", "Daño"], ["REJECTION", "Rechazo"], ["OTHER", "Otro"]];
export default async function ReportIncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { trip } = await getTrip(id); if (!trip || ["DELIVERED", "CANCELLED"].includes(trip.status)) notFound();
  return <div className="mx-auto max-w-xl space-y-6"><DesktopTopBar title="Reportar incidencia" description={trip.shipment_assignments?.shipment_requests?.cargo_description ?? "Viaje en curso"} /><Card><CardContent className="pt-6"><form action={incidentAction} className="space-y-4" encType="multipart/form-data"><input type="hidden" name="tripId" value={id} />
    <div className="space-y-1.5"><Label htmlFor="incidentType">Tipo de incidencia</Label><select id="incidentType" name="incidentType" className="h-9 w-full rounded-lg border bg-transparent px-3 text-sm">{TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
    <div className="space-y-1.5"><Label htmlFor="description">Descripción</Label><Textarea id="description" name="description" required minLength={5} /></div>
    <div className="space-y-1.5"><Label htmlFor="locationLabel">Ubicación</Label><Input id="locationLabel" name="locationLabel" placeholder="Km de referencia o distrito" /></div>
    <div className="space-y-1.5"><Label htmlFor="evidence">Evidencia opcional</Label><Input id="evidence" name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" /></div><Button className="w-full">Enviar reporte</Button>
  </form></CardContent></Card></div>;
}
