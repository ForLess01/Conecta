"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import { XCircle, PackageX, TimerOff, MessagesSquare, ArrowLeft } from "lucide-react";
import { getProductById } from "@/lib/mock/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MAX_QUICK_OFFER_ATTEMPTS, type QuickOfferStatus } from "@/lib/negotiation/quick-offer";

type NotAcceptedStatus = Exclude<QuickOfferStatus, "AUTO_ACCEPTED">;

const STATUS_CONTENT: Record<
  NotAcceptedStatus,
  { icon: typeof XCircle; title: string; description: (productName: string) => string; showImproveCta: boolean }
> = {
  NOT_ACCEPTED: {
    icon: XCircle,
    title: "La propuesta no fue aceptada",
    description: (productName) =>
      `Tu oferta rápida por ${productName} no fue aceptada en esta ocasión. Por seguridad comercial, no mostramos cuánto faltó para alcanzar el precio del productor.`,
    showImproveCta: true,
  },
  UNAVAILABLE: {
    icon: PackageX,
    title: "No hay stock suficiente",
    description: (productName) =>
      `La cantidad solicitada de ${productName} supera lo disponible o es menor al pedido mínimo. Ajusta la cantidad e inténtalo de nuevo.`,
    showImproveCta: true,
  },
  RATE_LIMITED: {
    icon: TimerOff,
    title: "Alcanzaste el máximo de intentos",
    description: (productName) =>
      `Ya usaste tus intentos de oferta rápida por ${productName} en esta ventana de tiempo. Espera a que se reinicie o pasa a negociación conversacional.`,
    showImproveCta: false,
  },
};

export default function OfferNotAcceptedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProductById(id);
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const status: NotAcceptedStatus =
    statusParam === "UNAVAILABLE" || statusParam === "RATE_LIMITED" ? statusParam : "NOT_ACCEPTED";
  const attemptsRemaining = Number(searchParams.get("attemptsRemaining") ?? MAX_QUICK_OFFER_ATTEMPTS - 1);

  if (!product) notFound();

  const content = STATUS_CONTENT[status];
  const Icon = content.icon;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[color:var(--crimson)]/10 text-[color:var(--crimson)]">
        <Icon className="size-8" />
      </span>
      <div>
        <h1 className="font-heading text-xl font-semibold">{content.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{content.description(product.name)}</p>
      </div>

      {status !== "UNAVAILABLE" && (
        <Card className="w-full">
          <CardContent className="pt-6">
            <p className="text-sm">
              Intentos restantes: <span className="font-semibold tabular-nums">{Math.max(0, attemptsRemaining)}</span> de{" "}
              {MAX_QUICK_OFFER_ATTEMPTS}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex w-full flex-col gap-2">
        {content.showImproveCta && (attemptsRemaining > 0 || status === "UNAVAILABLE") && (
          <Button asChild size="lg">
            <Link href={`/marketplace/offers/${product.id}`}>
              {status === "UNAVAILABLE" ? "Ajustar cantidad" : "Mejorar oferta"}
            </Link>
          </Button>
        )}
        {product.conversationalEnabled && (
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/negotiations/neg-1">
              <MessagesSquare className="size-4" /> Pasar a conversación
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost" size="lg" className="gap-2">
          <Link href="/marketplace">
            <ArrowLeft className="size-4" /> Cerrar
          </Link>
        </Button>
      </div>
    </div>
  );
}
