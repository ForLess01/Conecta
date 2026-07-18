import Link from "next/link";
import { notFound } from "next/navigation";
import { FileWarning, Image as ImageIcon } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { ReservationTimer } from "@/components/negotiation/reservation-timer";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSoles } from "@/lib/format";
import { getOrder } from "@/lib/server/commerce/commerce";
import { uuidSchema } from "@/lib/server/commerce/validation";
import { getMyActorContext } from "@/lib/supabase/session";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const [order, actor] = await Promise.all([getOrder(id), getMyActorContext()]);
  if (!order) notFound();
  const timeline = [
    { label: "Orden creada", at: order.createdAt, done: true },
    { label: "Logística confirmada", at: "", done: !["RESERVED", "PENDING_LOGISTICS"].includes(order.status) },
    { label: "En tránsito", at: "", done: ["IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(order.status) },
    { label: "Entregada", at: "", done: ["DELIVERED", "COMPLETED"].includes(order.status) },
  ];

  return <div className="space-y-6">
    <DesktopTopBar title={`Orden ${order.id}`} description={order.status.replaceAll("_", " ")} />
    {order.status === "RESERVED" && order.reservationExpiresAt && <Card><CardContent className="pt-6"><ReservationTimer expiresAt={order.reservationExpiresAt} /></CardContent></Card>}
    <Tabs defaultValue="resumen">
      <TabsList className="flex-wrap"><TabsTrigger value="resumen">Resumen</TabsTrigger><TabsTrigger value="productores">Productores</TabsTrigger><TabsTrigger value="logistica">Logística</TabsTrigger><TabsTrigger value="evidencias">Evidencias</TabsTrigger><TabsTrigger value="incidencias">Incidencias</TabsTrigger><TabsTrigger value="historial">Historial</TabsTrigger></TabsList>
      <TabsContent value="resumen" className="space-y-4"><Card><CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
        <div><p className="text-xs text-muted-foreground">Comprador</p><p className="text-sm font-medium">{order.buyerName}</p></div>
        <div><p className="text-xs text-muted-foreground">Productos</p><p className="text-sm font-medium">{order.items.map((item) => `${item.productName} (${item.quantity.toLocaleString("es-PE")} ${item.unit})`).join(", ")}</p></div>
        <div><p className="text-xs text-muted-foreground">Total comercial</p><p className="font-heading text-lg font-semibold tabular-nums">{formatSoles(order.total)}</p></div>
        <div><p className="text-xs text-muted-foreground">Estado actual</p><p className="text-sm font-medium">{order.status.replaceAll("_", " ")}</p></div>
      </CardContent></Card>{actor?.activeRole === "comprador" && ["RESERVED", "PENDING_LOGISTICS"].includes(order.status) && <Button asChild><Link href={`/orders/${order.id}/logistics`}>Seleccionar logística</Link></Button>}</TabsContent>
      <TabsContent value="productores" className="space-y-3">{order.items.flatMap((item) => item.allocations.map((allocation) => <Card key={allocation.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="text-sm font-medium">{allocation.producerName}</p><p className="text-xs text-muted-foreground">{allocation.quantity.toLocaleString("es-PE")} {item.unit} · {formatSoles(allocation.unitPrice)}/{item.unit}</p></div><span className="text-xs text-muted-foreground">{allocation.reservationStatus ?? "Sin reserva"}</span></CardContent></Card>))}</TabsContent>
      <TabsContent value="logistica"><Card><CardContent className="pt-6 text-sm text-muted-foreground">Consulta y selecciona la modalidad logística para continuar.</CardContent></Card></TabsContent>
      <TabsContent value="evidencias"><EmptyState icon={ImageIcon} title="Sin evidencias todavía" description="Las fotos de despacho y recepción aparecerán aquí." /></TabsContent>
      <TabsContent value="incidencias"><EmptyState icon={FileWarning} title="Sin incidencias reportadas" description="No hay reportes en esta orden." /></TabsContent>
      <TabsContent value="historial"><Card><CardContent className="pt-6"><OrderTimeline steps={timeline} /></CardContent></Card></TabsContent>
    </Tabs>
  </div>;
}
