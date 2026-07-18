"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types/domain";
import { formatSoles } from "@/lib/format";
import { evaluateQuickOffer, MAX_QUICK_OFFER_ATTEMPTS } from "@/lib/negotiation/quick-offer";
import { CategoryIcon } from "@/components/brand/category-icons";

export function QuickOfferDialog({
  product,
  open,
  onOpenChange,
  initialAttempt = 1,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAttempt?: number;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(product.minOrder);
  const [price, setPrice] = useState(product.priceRange.central);
  const attempt = initialAttempt;

  const subtotal = useMemo(() => quantity * price, [quantity, price]);
  const attemptsRemaining = MAX_QUICK_OFFER_ATTEMPTS - (attempt - 1);

  function submitOffer() {
    const result = evaluateQuickOffer({ product, offeredPricePerUnit: price, attemptNumber: attempt });
    onOpenChange(false);

    const params = new URLSearchParams({
      productId: product.id,
      price: String(price),
      quantity: String(quantity),
    });

    if (result.accepted) {
      router.push(`/marketplace/offers/${product.id}/match?${params.toString()}`);
    } else {
      router.push(
        `/marketplace/offers/${product.id}/not-accepted?${params.toString()}&attemptsRemaining=${result.attemptsRemaining}`
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <CategoryIcon category={product.category} className="text-primary" />
            Oferta rápida — {product.name}
          </DialogTitle>
          <DialogDescription>
            Rango sugerido {formatSoles(product.priceRange.low)} – {formatSoles(product.priceRange.high)} por {product.priceRange.unit}.
            Referencia central {formatSoles(product.priceRange.central)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Cantidad ({product.unit})</Label>
            <Input
              id="quantity"
              type="number"
              min={product.minOrder}
              max={product.quantityAvailable}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Precio por {product.unit}</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setPrice((p) => Number((p * 0.95).toFixed(2)))}>
                −5%
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPrice(product.priceRange.central)}>
                Usar referencia
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPrice((p) => Number((p * 1.05).toFixed(2)))}>
                +5%
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-muted p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-heading font-semibold tabular-nums">{formatSoles(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">El transporte no está incluido en este subtotal.</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Intentos disponibles: {attemptsRemaining} de {MAX_QUICK_OFFER_ATTEMPTS}
          </p>
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submitOffer} disabled={attemptsRemaining <= 0}>
            Enviar oferta rápida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
