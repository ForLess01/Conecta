"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import { XCircle, MessagesSquare, ArrowLeft } from "lucide-react";
import { getProductById } from "@/lib/mock/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MAX_QUICK_OFFER_ATTEMPTS } from "@/lib/negotiation/quick-offer";

export default function OfferNotAcceptedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProductById(id);
  const searchParams = useSearchParams();
  const attemptsRemaining = Number(searchParams.get("attemptsRemaining") ?? MAX_QUICK_OFFER_ATTEMPTS - 1);

  if (!product) notFound();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[color:var(--crimson)]/10 text-[color:var(--crimson)]">
        <XCircle className="size-8" />
      </span>
      <div>
        <h1 className="font-heading text-xl font-semibold">La propuesta no fue aceptada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu oferta rápida por {product.name} no fue aceptada en esta ocasión. Por seguridad comercial, no
          mostramos cuánto faltó para alcanzar el precio del productor.
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-sm">
            Intentos restantes: <span className="font-semibold tabular-nums">{Math.max(0, attemptsRemaining)}</span> de{" "}
            {MAX_QUICK_OFFER_ATTEMPTS}
          </p>
        </CardContent>
      </Card>

      <div className="flex w-full flex-col gap-2">
        {attemptsRemaining > 0 && (
          <Button asChild size="lg">
            <Link href={`/marketplace/offers/${product.id}`}>Mejorar oferta</Link>
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
