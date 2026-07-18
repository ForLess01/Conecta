import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderReservationTimer } from "@/components/orders/order-reservation-timer";
import { formatSoles } from "@/lib/format";
import { getActiveListing } from "@/lib/server/marketplace/queries";
import { getNegotiation, getOrder } from "@/lib/server/commerce/commerce";

export default async function OfferMatchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ orderId?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!query.orderId) notFound();
  const [listing, order] = await Promise.all([getActiveListing(id), getOrder(query.orderId)]);
  if (!listing || listing.type !== "offer" || !order?.negotiationId) notFound();
  const negotiation = await getNegotiation(order.negotiationId);
  const item = order.items[0];
  if (!negotiation || negotiation.listingId !== listing.id || !item) notFound();
  const reservationActive = order.status === "RESERVED";
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary"><CheckCircle2 className="size-8" /></span>
      <div><h1 className="font-heading text-xl font-semibold">¡Match confirmado!</h1><p className="mt-2 text-sm text-muted-foreground">Tu oferta rápida por {listing.productName} fue aceptada. Continuá a logística antes de que venza la reserva.</p></div>
      <Card className="w-full"><CardContent className="space-y-3 pt-6">{reservationActive && order.reservationExpiresAt && <OrderReservationTimer expiresAt={order.reservationExpiresAt} />}<div className="space-y-1.5 border-t border-border pt-3 text-left text-sm"><Row label="Precio acordado" value={`${formatSoles(item.unitPrice)} / ${item.unit}`} /><Row label="Cantidad reservada" value={`${item.quantity.toLocaleString("es-PE")} ${item.unit}`} /><Row label="Subtotal" value={formatSoles(item.unitPrice * item.quantity)} /></div></CardContent></Card>
      <div className="flex w-full flex-col gap-2">{reservationActive ? <Button asChild size="lg"><Link href={`/orders/${order.id}/logistics`}>Continuar a logística</Link></Button> : <Button size="lg" disabled>Reserva vencida</Button>}<Button asChild variant="outline" size="lg"><Link href={`/orders/${order.id}`}>Ver orden</Link></Button></div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium tabular-nums">{value}</span></div>;
}
