import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getTrip } from "@/lib/server/trips";
import { deliveryAction } from "../actions";

export default async function RegisterDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { trip } = await getTrip(id); if (!trip || !["IN_TRANSIT", "DELAYED"].includes(trip.status)) notFound();
  const cargo = trip.shipment_assignments?.shipment_requests?.cargo_description ?? "Carga";
  return <div className="mx-auto max-w-xl space-y-6"><DesktopTopBar title="Registrar entrega" description={cargo} /><Card><CardContent className="pt-6"><form action={deliveryAction} className="space-y-4" encType="multipart/form-data"><input type="hidden" name="tripId" value={id} />
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Peso final (kg)" name="weightKg" type="number" step="0.001" required /><Field label="Cantidad aceptada" name="acceptedQuantity" type="number" step="0.001" required /></div>
    <Field label="Cantidad observada" name="observedQuantity" type="number" step="0.001" defaultValue="0" required />
    <div className="space-y-1.5"><Label htmlFor="conditionNotes">Motivo de observación</Label><Textarea id="conditionNotes" name="conditionNotes" placeholder="Daños, humedad o rechazo parcial" /></div>
    <Field label="Evidencia (JPEG, PNG, WebP o PDF; máximo 10 MB)" name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
    <div className="space-y-1.5"><Label htmlFor="notes">Notas de recepción</Label><Textarea id="notes" name="notes" /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirmed" value="true" required /> Confirmo que la entrega fue verificada con el receptor</label><Button className="w-full">Confirmar entrega</Button>
  </form></CardContent></Card></div>;
}
function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>; }
