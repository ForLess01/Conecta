import Link from "next/link";
import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatSoles, formatDateTime } from "@/lib/format";
import { getShipment, listShipmentBids } from "@/lib/server/shipments";
import { listMyVehicles } from "@/lib/server/vehicles";
import { getMyActorContext } from "@/lib/supabase/session";
import { submitBidAction, withdrawBidAction } from "./actions";

export default async function FreightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [freight, vehicles, actor, bids] = await Promise.all([getShipment(id), listMyVehicles(true), getMyActorContext(), listShipmentBids(id)]);
  if (!freight) notFound();
  const myBid = bids.find((bid) => bid.transporter_actor_id === actor?.id && bid.status === "ACTIVE");
  return <div className="space-y-6">
    <DesktopTopBar title={`${freight.origin_label ?? "Origen"} → ${freight.destination_label ?? "Destino"}`} description={`Solicitud ${freight.id.slice(0, 8).toUpperCase()} · ${freight.status}`} />
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-4">
        <Card><CardContent className="space-y-4 pt-6"><h2 className="font-heading font-semibold">Detalle de la carga</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Info label="Carga" value={freight.cargo_description ?? "—"} /><Info label="Peso" value={`${Number(freight.total_weight_kg ?? 0).toLocaleString("es-PE")} kg`} /><Info label="Volumen" value={freight.total_volume_m3 ? `${freight.total_volume_m3} m³` : "—"} /><Info label="Bultos" value={String(freight.package_count ?? "—")} /></div>
        </CardContent></Card>
        <Card><CardContent className="space-y-3 pt-6"><h2 className="font-heading font-semibold">Programación</h2>
          <p className="text-sm">Recojo: <strong>{freight.scheduled_pickup_at ? formatDateTime(freight.scheduled_pickup_at) : "Por coordinar"}</strong></p>
          <p className="text-sm">Tarifa de referencia: <strong>{freight.suggested_fare ? formatSoles(Number(freight.suggested_fare)) : "A convenir"}</strong></p>
          {freight.loading_notes && <p className="text-sm text-muted-foreground">{freight.loading_notes}</p>}
        </CardContent></Card>
      </div>
      <Card id="ofertar" className="lg:sticky lg:top-20 lg:self-start"><CardContent className="pt-6">
        {actor?.roles.includes("transportista") ? myBid ? <div className="space-y-4"><h2 className="font-heading font-semibold">Tu oferta está activa</h2><p className="text-2xl font-semibold">{formatSoles(Number(myBid.fare_amount))}</p>
          <form action={withdrawBidAction}><input type="hidden" name="shipmentId" value={freight.id} /><input type="hidden" name="bidId" value={myBid.id} /><Button variant="destructive" className="w-full">Retirar oferta</Button></form>
        </div> : vehicles.length ? <form action={submitBidAction} className="space-y-4"><h2 className="font-heading font-semibold">Enviar oferta de flete</h2>
          <input type="hidden" name="shipmentId" value={freight.id} />
          <Field label="Tarifa propuesta" name="fare" type="number" step="0.01" defaultValue={freight.suggested_fare ?? ""} required />
          <div className="space-y-1.5"><Label htmlFor="vehicleId">Vehículo disponible</Label><select id="vehicleId" name="vehicleId" required className="h-9 w-full rounded-lg border bg-transparent px-3 text-sm">{vehicles.map((v) => <option key={v.id} value={v.id}>{v.display_name ?? v.vehicle_types?.name} · {v.plate}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Salida" name="departureAt" type="datetime-local" required /><Field label="Duración (h)" name="durationHours" type="number" defaultValue="4" required /></div>
          <label className="flex gap-2 text-sm"><input type="checkbox" name="helperIncluded" /> Incluye ayudante</label><label className="flex gap-2 text-sm"><input type="checkbox" name="insuranceIncluded" /> Incluye seguro</label>
          <div className="space-y-1.5"><Label htmlFor="conditions">Condiciones</Label><Textarea id="conditions" name="conditions" /></div><Button className="w-full">Enviar oferta</Button>
        </form> : <div className="space-y-3"><p className="text-sm text-muted-foreground">Necesitás un vehículo activo y disponible antes de ofertar.</p><Button asChild><Link href="/vehicles">Gestionar flota</Link></Button></div> : <div className="space-y-3"><h2 className="font-heading font-semibold">Ofertas recibidas</h2><p className="text-sm text-muted-foreground">Compará transportistas y seleccioná una oferta.</p><Button asChild><Link href={`/transport/${id}/compare`}>Comparar {bids.length} ofertas</Link></Button></div>}
      </CardContent></Card>
    </div>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted/60 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div>; }
function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>; }
