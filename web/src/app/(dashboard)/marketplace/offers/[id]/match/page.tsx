"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams, notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getProductById } from "@/lib/mock/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReservationTimer } from "@/components/negotiation/reservation-timer";
import { formatSoles, formatQuantity } from "@/lib/format";
import { RESERVATION_MINUTES } from "@/lib/negotiation/quick-offer";

export default function OfferMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProductById(id);
  const searchParams = useSearchParams();

  if (!product) notFound();

  const price = Number(searchParams.get("price") ?? product.priceRange.central);
  const quantity = Number(searchParams.get("quantity") ?? product.minOrder);
  const subtotal = price * quantity;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
        <CheckCircle2 className="size-8" />
      </span>
      <div>
        <h1 className="font-heading text-xl font-semibold">¡Match confirmado!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu oferta rápida por {product.name} fue aceptada. Continúa a logística antes de que venza la reserva.
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="space-y-3 pt-6">
          <ReservationTimer minutes={RESERVATION_MINUTES} />
          <div className="space-y-1.5 border-t border-border pt-3 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio acordado</span>
              <span className="font-medium tabular-nums">{formatSoles(price)} / {product.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cantidad reservada</span>
              <span className="font-medium tabular-nums">{formatQuantity(quantity, product.unit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-heading font-semibold tabular-nums">{formatSoles(subtotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex w-full flex-col gap-2">
        <Button asChild size="lg">
          <Link href={`/orders/order-1/logistics`}>Continuar a logística</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/orders/order-1">Ver orden</Link>
        </Button>
      </div>
    </div>
  );
}
