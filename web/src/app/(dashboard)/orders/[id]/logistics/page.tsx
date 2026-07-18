import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, Home, Search } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { getOrderLogistics } from "@/lib/server/shipments";
import { selectLogisticsModeAction } from "@/app/(dashboard)/transport/actions";

const OPTIONS = [
  { mode: "BUYER_PICKUP", icon: Home, title: "Recoge el comprador", description: "Organiza el transporte con vehículo propio.", detail: "Responsabilidad del comprador" },
  { mode: "PRODUCER_DELIVERY", icon: Truck, title: "Entrega el productor", description: "El productor coordina la entrega con su vehículo.", detail: "Entrega incluida por el productor" },
  { mode: "MARKETPLACE_FREIGHT", icon: Search, title: "Buscar transporte", description: "Publica la carga y compara ofertas verificadas.", detail: "Transportista seleccionado por vos" },
] as const;

export default async function LogisticsModeSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, shipment } = await getOrderLogistics(id);
  if (!order) notFound();
  return <div className="space-y-6">
    <DesktopTopBar title="Selecciona la modalidad logística" description={`Orden ${id.slice(0, 8).toUpperCase()}`} />
    {shipment && <p className="rounded-xl bg-muted px-4 py-3 text-sm">Modalidad actual: <strong>{shipment.logistics_mode.replaceAll("_", " ")}</strong> · {shipment.status}</p>}
    <div className="grid gap-4 md:grid-cols-3">{OPTIONS.map(({ mode, icon: Icon, title, description, detail }) => (
      <form action={selectLogisticsModeAction} key={mode} className="flex flex-col rounded-2xl border border-border bg-card p-6">
        <input type="hidden" name="orderId" value={id} /><input type="hidden" name="mode" value={mode} />
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-secondary text-primary"><Icon className="size-5" /></span>
        <h2 className="font-heading font-semibold">{title}</h2><p className="mt-1 flex-1 text-sm text-muted-foreground">{description}</p>
        <p className="my-4 border-t pt-3 text-xs text-muted-foreground">{detail}</p><Button type="submit" variant={mode === shipment?.logistics_mode ? "secondary" : "outline"}>Seleccionar</Button>
      </form>
    ))}</div>
    <div className="flex justify-end"><Button variant="ghost" asChild><Link href={`/orders/${id}`}>Cancelar</Link></Button></div>
  </div>;
}
