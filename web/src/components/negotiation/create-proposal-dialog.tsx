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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProposalDraft {
  quantity: number;
  unitPrice: number;
  deliveryDate: string | null;
  logisticsMode: "BUYER_PICKUP" | "PRODUCER_DELIVERY" | "MARKETPLACE_FREIGHT";
}

export function CreateProposalDialog({
  open,
  onOpenChange,
  defaults,
  onSubmit,
  pending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults: ProposalDraft & { unit: string };
  onSubmit: (proposal: ProposalDraft) => void | Promise<void>;
  pending?: boolean;
}) {
  const [quantity, setQuantity] = useState(defaults.quantity);
  const [price, setPrice] = useState(defaults.unitPrice);
  const [deliveryDate, setDeliveryDate] = useState(defaults.deliveryDate);
  const [logisticsMode, setLogisticsMode] = useState(defaults.logisticsMode);

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
              unitPrice: price,
              deliveryDate: deliveryDate || null,
              logisticsMode,
            });
          }}
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Cantidad ({defaults.unit})</Label>
              <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio por {defaults.unit}</Label>
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delivery">Fecha de entrega</Label>
            <Input id="delivery" type="date" value={deliveryDate ?? ""} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Modalidad logística</Label>
            <Select value={logisticsMode} onValueChange={(value) => value && setLogisticsMode(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUYER_PICKUP">Recoge el comprador</SelectItem>
                <SelectItem value="PRODUCER_DELIVERY">Entrega el productor</SelectItem>
                <SelectItem value="MARKETPLACE_FREIGHT">Buscar transporte en marketplace</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || quantity <= 0 || price <= 0}>{pending ? "Enviando..." : "Enviar propuesta"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
