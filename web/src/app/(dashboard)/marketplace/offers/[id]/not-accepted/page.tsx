import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StartConversationButton } from "@/components/negotiation/start-conversation-button";
import { Card, CardContent } from "@/components/ui/card";
import { MAX_QUICK_OFFER_ATTEMPTS } from "@/lib/negotiation/quick-offer";
import { getActiveListing } from "@/lib/server/marketplace/queries";

export default async function OfferNotAcceptedPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ attemptsRemaining?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const listing = await getActiveListing(id);
  if (!listing || listing.type !== "offer") notFound();
  const attemptsRemaining = Math.max(0, Number(query.attemptsRemaining ?? 0));
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[color:var(--crimson)]/10 text-[color:var(--crimson)]"><XCircle className="size-8" /></span>
      <div><h1 className="font-heading text-xl font-semibold">La propuesta no fue aceptada</h1><p className="mt-2 text-sm text-muted-foreground">Tu oferta rápida por {listing.productName} no fue aceptada. Por seguridad comercial, no mostramos cuánto faltó para alcanzar el mínimo del productor.</p></div>
      <Card className="w-full"><CardContent className="pt-6"><p className="text-sm">Intentos restantes: <span className="font-semibold tabular-nums">{attemptsRemaining}</span> de {MAX_QUICK_OFFER_ATTEMPTS}</p></CardContent></Card>
      <div className="flex w-full flex-col gap-2">
        {attemptsRemaining > 0 && <Button asChild size="lg"><Link href={`/marketplace/offers/${listing.id}`}>Mejorar oferta</Link></Button>}
        <StartConversationButton listingId={listing.id} label="Pasar a conversación" size="lg" />
        <Button asChild variant="ghost" size="lg" className="gap-2"><Link href="/marketplace"><ArrowLeft className="size-4" /> Cerrar</Link></Button>
      </div>
    </div>
  );
}
