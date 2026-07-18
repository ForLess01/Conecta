"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuickOfferResponse } from "@/lib/negotiation/quick-offer";

export function QuickOfferButton({ listingId, productName, unitSymbol, minimumQuantity, maximumQuantity }: { listingId: string; productName: string; unitSymbol: string; minimumQuantity: number; maximumQuantity: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const quantity = Number(formData.get("quantity"));
      const offeredPricePerUnit = Number(formData.get("price"));
      try {
        const response = await fetch("/api/negotiations/quick-offer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: listingId, quantity, offeredPricePerUnit }),
        });
        const result = await response.json() as QuickOfferResponse | { error?: string };
        if (!response.ok || !("accepted" in result)) throw new Error("error" in result && result.error ? result.error : "No se pudo procesar la oferta.");
        const query = new URLSearchParams({ price: String(offeredPricePerUnit), quantity: String(quantity), attemptsRemaining: String(result.attemptsRemaining) });
        query.set("status", result.status);
        if (result.orderId) query.set("orderId", result.orderId);
        if (result.negotiationId) query.set("negotiationId", result.negotiationId);
        if (result.reservationExpiresAt) query.set("reservationExpiresAt", result.reservationExpiresAt);
        setOpen(false);
        router.push(`/marketplace/offers/${listingId}/${result.accepted ? "match" : "not-accepted"}?${query}`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo procesar la oferta.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full gap-2" />}><Zap className="size-4" /> Oferta rápida</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Oferta rápida por {productName}</DialogTitle><DialogDescription>Ingresá cantidad y precio por {unitSymbol}. El mínimo privado del productor nunca se revela.</DialogDescription></DialogHeader>
        <form action={submit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="quick-quantity">Cantidad ({unitSymbol})</Label><Input id="quick-quantity" name="quantity" type="number" min={minimumQuantity} max={maximumQuantity} step="0.01" defaultValue={minimumQuantity} required /></div>
          <div className="space-y-1.5"><Label htmlFor="quick-price">Precio por {unitSymbol}</Label><Input id="quick-price" name="price" type="number" min="0.01" step="0.01" required /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Enviando…" : "Enviar oferta"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
