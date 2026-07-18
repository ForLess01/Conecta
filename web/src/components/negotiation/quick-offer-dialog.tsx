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
import {
  MAX_QUICK_OFFER_ATTEMPTS,
  type QuickOfferResponse,
} from "@/lib/negotiation/quick-offer";
import { CategoryIcon } from "@/components/brand/category-icons";

export function QuickOfferDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(product.minOrder);
  const [price, setPrice] = useState(product.priceRange.central);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const subtotal = useMemo(() => quantity * price, [quantity, price]);

  async function submitOffer() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/negotiations/quick-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          offeredPricePerUnit: price,
        }),
      });

      const payload = (await response.json()) as QuickOfferResponse | { error?: string };

      if (!response.ok || !("accepted" in payload)) {
        throw new Error("error" in payload && payload.error ? payload.error : "No se pudo procesar la oferta rápida.");
      }

      onOpenChange(false);

      const params = new URLSearchParams({
        productId: product.id,
        price: String(price),
        quantity: String(quantity),
        status: payload.status,
      });

      if (payload.accepted) {
        if (payload.reservationExpiresAt) {
          params.set("reservationExpiresAt", payload.reservationExpiresAt);
        }
        if (payload.orderId) params.set("orderId", payload.orderId);
        if (payload.negotiationId) params.set("negotiationId", payload.negotiationId);
        router.push(`/marketplace/offers/${product.id}/match?${params.toString()}`);
      } else {
        params.set("attemptsRemaining", String(payload.attemptsRemaining));
        router.push(`/marketplace/offers/${product.id}/not-accepted?${params.toString()}`);
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo procesar la oferta rápida."
      );
    } finally {
      setIsSubmitting(false);
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

          <div className="space-y-2">
            <Label htmlFor="price">Precio por {product.unit}</Label>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 text-white p-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:bg-zinc-900 hover:text-white text-2xl font-light h-10 w-10 rounded-full select-none"
                onClick={() => setPrice((p) => Math.max(0.01, Number((p - 0.05).toFixed(2))))}
              >
                −
              </Button>

              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-semibold mr-1 text-zinc-400">S/</span>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="bg-transparent text-center border-none text-white text-2xl font-bold focus:ring-0 focus:outline-none w-20 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <span className="text-xs text-zinc-400 mt-0.5 select-none">Precio Sugerido</span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:bg-zinc-900 hover:text-white text-2xl font-light h-10 w-10 rounded-full select-none"
                onClick={() => setPrice((p) => Number((p + 0.05).toFixed(2)))}
              >
                +
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
            Máximo de intentos: {MAX_QUICK_OFFER_ATTEMPTS}
          </p>
          {submitError && (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={submitOffer} disabled={isSubmitting || quantity <= 0 || price <= 0}>
            {isSubmitting ? "Enviando…" : "Enviar oferta rápida"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
