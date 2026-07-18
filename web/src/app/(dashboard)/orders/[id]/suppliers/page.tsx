import Link from "next/link";
import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatSoles } from "@/lib/format";
import { getOrder } from "@/lib/server/commerce/commerce";
import { uuidSchema } from "@/lib/server/commerce/validation";

export default async function SuppliersAllocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const order = await getOrder(id);
  if (!order) notFound();
  const allocations = order.items.flatMap((item) => item.allocations.map((allocation) => ({ ...allocation, unit: item.unit, productName: item.productName })));

  return <div className="space-y-6">
    <DesktopTopBar title="Productores asignados" description={`Orden ${order.id}`} />
    <div className="space-y-3">{allocations.map((allocation) => <Card key={allocation.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="font-medium">{allocation.producerName}</p><p className="text-sm text-muted-foreground">{allocation.productName} · {allocation.quantity.toLocaleString("es-PE")} {allocation.unit} · {formatSoles(allocation.unitPrice)}/{allocation.unit}</p></div><span className="text-xs text-muted-foreground">{allocation.reservationStatus ?? "Sin reserva"}</span></CardContent></Card>)}</div>
    <div className="flex justify-end"><Button asChild><Link href={`/orders/${order.id}`}>Volver a la orden</Link></Button></div>
  </div>;
}
