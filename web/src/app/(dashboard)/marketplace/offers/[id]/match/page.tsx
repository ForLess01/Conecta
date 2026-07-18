import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReservationTimer } from "@/components/negotiation/reservation-timer";
import { formatSoles } from "@/lib/format";
import { RESERVATION_MINUTES } from "@/lib/negotiation/quick-offer";
import { getActiveListing } from "@/lib/server/marketplace/queries";

export default async function OfferMatchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ price?: string; quantity?: string; orderId?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const listing = await getActiveListing(id);
  if (!listing || listing.type !== "offer" || !query.orderId) notFound();
  const price = Number(query.price);
  const quantity = Number(query.quantity);
  if (!Number.isFinite(price) || !Number.isFinite(quantity) || price <= 0 || quantity <= 0) notFound();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary"><CheckCircle2 className="size-8" /></span>
      <div><h1 className="font-heading text-xl font-semibold">¡Match confirmado!</h1><p className="mt-2 text-sm text-muted-foreground">Tu oferta rápida por {listing.productName} fue aceptada. Continuá a logística antes de que venza la reserva.</p></div>
      <Card className="w-full"><CardContent className="space-y-3 pt-6"><ReservationTimer minutes={RESERVATION_MINUTES} /><div className="space-y-1.5 border-t border-border pt-3 text-left text-sm"><Row label="Precio acordado" value={`${formatSoles(price)} / ${listing.unitSymbol}`} /><Row label="Cantidad reservada" value={`${quantity.toLocaleString("es-PE")} ${listing.unitSymbol}`} /><Row label="Subtotal" value={formatSoles(price * quantity)} /></div></CardContent></Card>
      <div className="flex w-full flex-col gap-2"><Button asChild size="lg"><Link href={`/orders/${query.orderId}/logistics`}>Continuar a logística</Link></Button><Button asChild variant="outline" size="lg"><Link href={`/orders/${query.orderId}`}>Ver orden</Link></Button></div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium tabular-nums">{value}</span></div>;
}
