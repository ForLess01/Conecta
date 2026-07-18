"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getNegotiationById } from "@/lib/mock/negotiations";
import { getProductById } from "@/lib/mock/products";
import { PRODUCERS, BUYERS } from "@/lib/mock/actors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ConversationalMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const negotiation = getNegotiationById(id);
  if (!negotiation) notFound();

  const product = getProductById(negotiation.productId);
  const producer = PRODUCERS.find((p) => p.id === negotiation.producerId);
  const buyer = BUYERS.find((b) => b.id === negotiation.buyerId);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
        <CheckCircle2 className="size-8" />
      </span>
      <div>
        <h1 className="font-heading text-xl font-semibold">Match conversacional confirmado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          El acuerdo entre {buyer?.name} y {producer?.name} por {product?.name} fue confirmado. Se generó la orden{" "}
          <span className="font-medium text-foreground">ORDER-1</span>.
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="space-y-2 pt-6 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Comprador</span>
            <span className="font-medium">{buyer?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Productor</span>
            <span className="font-medium">{producer?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Producto</span>
            <span className="font-medium">{product?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Siguiente paso</span>
            <span className="font-medium">Seleccionar logística</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex w-full flex-col gap-2">
        <Button asChild size="lg">
          <Link href="/orders/order-1/logistics">Continuar a logística</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/orders/order-1">Ver orden</Link>
        </Button>
      </div>
    </div>
  );
}
