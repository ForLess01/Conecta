"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Proposal } from "@/types/domain";

export function CreateProposalDialog({
  open,
  onOpenChange,
  defaults,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults: Pick<Proposal, "quantity" | "unit" | "pricePerUnit" | "deliveryDate" | "qualityTerms" | "logisticsMode">;
  onSubmit: (proposal: Omit<Proposal, "id" | "negotiationId" | "authorId" | "status">) => void;
}) {
  const [quantity, setQuantity] = useState(defaults.quantity);
  const [price, setPrice] = useState(defaults.pricePerUnit);
  const [deliveryDate, setDeliveryDate] = useState(defaults.deliveryDate);
  const [qualityTerms, setQualityTerms] = useState(defaults.qualityTerms);
  const [logisticsMode, setLogisticsMode] = useState(defaults.logisticsMode);
  const [notes, setNotes] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Crear propuesta estructurada</DialogTitle>
          <DialogDescription>Define los términos comerciales y envíalos como propuesta formal.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              quantity,
              unit: defaults.unit,
              pricePerUnit: price,
              deliveryDate,
              qualityTerms,
              logisticsMode,
              validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              notes: notes || undefined,
            });
            onOpenChange(false);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Cantidad ({defaults.unit})</Label>
              <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio por {defaults.unit}</Label>
              <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delivery">Fecha de entrega</Label>
            <Input id="delivery" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quality">Términos de calidad</Label>
            <Input id="quality" value={qualityTerms} onChange={(e) => setQualityTerms(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Modalidad logística</Label>
            <Select value={logisticsMode} onValueChange={(value) => value && setLogisticsMode(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Recoge el comprador">Recoge el comprador</SelectItem>
                <SelectItem value="Entrega el productor">Entrega el productor</SelectItem>
                <SelectItem value="Buscar transporte en marketplace">Buscar transporte en marketplace</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condiciones de pago, empaque, etc." />
          </div>
          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Enviar propuesta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
