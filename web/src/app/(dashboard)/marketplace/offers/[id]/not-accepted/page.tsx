import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageX, TimerOff, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StartConversationButton } from "@/components/negotiation/start-conversation-button";
import { Card, CardContent } from "@/components/ui/card";
import { MAX_QUICK_OFFER_ATTEMPTS, type QuickOfferStatus } from "@/lib/negotiation/quick-offer";
import { getActiveListing } from "@/lib/server/marketplace/queries";

type NotAcceptedStatus = Exclude<QuickOfferStatus, "AUTO_ACCEPTED">;

const STATUS_CONTENT: Record<NotAcceptedStatus, { icon: typeof XCircle; title: string; description: (name: string) => string; showAttempts: boolean }> = {
  NOT_ACCEPTED: {
    icon: XCircle,
    title: "La propuesta no fue aceptada",
    description: (name) => `Tu oferta rápida por ${name} no fue aceptada. Por seguridad comercial, no mostramos cuánto faltó para alcanzar el mínimo del productor.`,
    showAttempts: true,
  },
  UNAVAILABLE: {
    icon: PackageX,
    title: "No hay stock suficiente",
    description: (name) => `La cantidad solicitada de ${name} no está disponible. Ajusta la cantidad e inténtalo nuevamente.`,
    showAttempts: false,
  },
  RATE_LIMITED: {
    icon: TimerOff,
    title: "Alcanzaste el máximo de intentos",
    description: (name) => `Ya usaste tus intentos de oferta rápida por ${name}. Espera a que se reinicie la ventana o pasa a negociación conversacional.`,
    showAttempts: true,
  },
};

export default async function OfferNotAcceptedPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ attemptsRemaining?: string; status?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const listing = await getActiveListing(id);
  if (!listing || listing.type !== "offer") notFound();

  const status: NotAcceptedStatus = query.status === "UNAVAILABLE" || query.status === "RATE_LIMITED" ? query.status : "NOT_ACCEPTED";
  const attemptsRemaining = Math.max(0, Number(query.attemptsRemaining ?? 0));
  const content = STATUS_CONTENT[status];
  const Icon = content.icon;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[color:var(--crimson)]/10 text-[color:var(--crimson)]"><Icon className="size-8" /></span>
      <div><h1 className="font-heading text-xl font-semibold">{content.title}</h1><p className="mt-2 text-sm text-muted-foreground">{content.description(listing.productName)}</p></div>
      {content.showAttempts && <Card className="w-full"><CardContent className="pt-6"><p className="text-sm">Intentos restantes: <span className="font-semibold tabular-nums">{attemptsRemaining}</span> de {MAX_QUICK_OFFER_ATTEMPTS}</p></CardContent></Card>}
      <div className="flex w-full flex-col gap-2">
        {status !== "RATE_LIMITED" && <Button asChild size="lg"><Link href={`/marketplace/offers/${listing.id}`}>{status === "UNAVAILABLE" ? "Ajustar cantidad" : "Mejorar oferta"}</Link></Button>}
        <StartConversationButton listingId={listing.id} label="Pasar a conversación" size="lg" />
        <Button asChild variant="ghost" size="lg" className="gap-2"><Link href="/marketplace"><ArrowLeft className="size-4" /> Cerrar</Link></Button>
      </div>
    </div>
  );
}
