import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getOrderLogistics } from "@/lib/server/shipments";
import { saveShipmentAction } from "../actions";

export default async function CreateFreightRequestPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;
  if (!orderId) notFound();
  const { order, shipment } = await getOrderLogistics(orderId);
  if (!order) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DesktopTopBar title="Crear solicitud de transporte" description={`Orden ${order.id.slice(0, 8).toUpperCase()} · guarda un borrador o publícalo`} />
      <form action={saveShipmentAction} className="space-y-5">
        <input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="mode" value="MARKETPLACE_FREIGHT" />
        <Card><CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Punto de recojo" name="originLabel" defaultValue={shipment?.origin_label ?? ""} required />
            <Field label="Destino" name="destinationLabel" defaultValue={shipment?.destination_label ?? ""} required />
            <Field label="Peso (kg)" name="weightKg" type="number" defaultValue={shipment?.total_weight_kg ?? ""} required />
            <Field label="Volumen (m³)" name="volumeM3" type="number" step="0.001" defaultValue={shipment?.total_volume_m3 ?? ""} />
            <Field label="Número de bultos" name="packageCount" type="number" defaultValue={shipment?.package_count ?? ""} />
            <Field label="Fecha y hora requerida" name="scheduledPickupAt" type="datetime-local" defaultValue={shipment?.scheduled_pickup_at?.slice(0, 16) ?? ""} required />
          </div>
          <div className="space-y-1.5"><Label htmlFor="cargoDescription">Descripción de la carga</Label><Textarea id="cargoDescription" name="cargoDescription" defaultValue={shipment?.cargo_description ?? ""} required /></div>
        </CardContent></Card>
        <Card><CardContent className="space-y-4 pt-6">
          <Field label="Tarifa inicial sugerida (S/)" name="suggestedFare" type="number" step="0.01" defaultValue={shipment?.suggested_fare ?? ""} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="needsHelper" defaultChecked={shipment?.needs_helper} /> Requiere ayudante para carga o descarga</label>
          <div className="space-y-1.5"><Label htmlFor="loadingNotes">Observaciones</Label><Textarea id="loadingNotes" name="loadingNotes" defaultValue={shipment?.loading_notes ?? ""} /></div>
        </CardContent></Card>
        <div className="flex justify-end gap-2"><Button name="intent" value="draft" variant="outline">Guardar borrador</Button><Button name="intent" value="publish">Publicar solicitud</Button></div>
      </form>
    </div>
  );
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>;
}
