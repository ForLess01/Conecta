"use client";

import { use } from "react";
import { useRouter, notFound } from "next/navigation";
import { toast } from "sonner";
import { getTripById } from "@/lib/mock/logistics";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trip = getTripById(id);
  const router = useRouter();
  if (!trip) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <DesktopTopBar title="Registrar entrega" description={trip.cargoDescription} />
      <Card>
        <CardContent className="pt-6">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Entrega confirmada (demo).");
              router.push(`/orders/order-1`);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="finalWeight">Peso final (kg)</Label>
                <Input id="finalWeight" type="number" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accepted">Cantidad aceptada</Label>
                <Input id="accepted" type="number" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="observed">Cantidad observada (con motivo)</Label>
              <Input id="observed" placeholder="Ej. 20 kg con daño por humedad" />
            </div>
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Adjuntar fotografías de recepción (demo)
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="confirm" required />
              <Label htmlFor="confirm" className="text-sm font-normal">El receptor confirma la entrega</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit">Confirmar entrega</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
