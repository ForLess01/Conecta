import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getTrip } from "@/lib/server/trips";
import { pickupAction } from "../actions";

export default async function RegisterPickupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { trip } = await getTrip(id); if (!trip || trip.status !== "SCHEDULED") notFound();
  const cargo = trip.shipment_assignments?.shipment_requests?.cargo_description ?? "Carga";
  return <OperationForm title="Registrar recojo" description={cargo} action={pickupAction} tripId={id} />;
}

function OperationForm({ title, description, action, tripId }: { title: string; description: string; action: (data: FormData) => Promise<void>; tripId: string }) {
  return <div className="mx-auto max-w-xl space-y-6"><DesktopTopBar title={title} description={description} /><Card><CardContent className="pt-6"><form action={action} className="space-y-4" encType="multipart/form-data"><input type="hidden" name="tripId" value={tripId} />
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Peso cargado (kg)" name="weightKg" type="number" step="0.001" required /><Field label="Número de bultos" name="packageCount" type="number" required /></div>
    <Field label="Evidencia (JPEG, PNG, WebP o PDF; máximo 10 MB)" name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
    <div className="space-y-1.5"><Label htmlFor="conditionNotes">Estado de la mercadería</Label><Input id="conditionNotes" name="conditionNotes" placeholder="Buen estado, sin daños visibles" /></div>
    <div className="space-y-1.5"><Label htmlFor="notes">Observaciones</Label><Textarea id="notes" name="notes" /></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirmed" value="true" required /> Confirmo que el recojo fue verificado con la contraparte</label><Button className="w-full">Confirmar recojo</Button>
  </form></CardContent></Card></div>;
}
function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>; }
