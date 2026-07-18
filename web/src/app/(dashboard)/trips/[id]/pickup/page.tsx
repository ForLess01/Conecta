"use client";

import { use } from "react";
import { useRouter, notFound } from "next/navigation";
import { toast } from "sonner";
import { getTripById } from "@/lib/mock/logistics";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterPickupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trip = getTripById(id);
  const router = useRouter();
  if (!trip) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <DesktopTopBar title="Registrar recojo" description={trip.cargoDescription} />
      <Card>
        <CardContent className="pt-6">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Recojo confirmado.");
              router.push(`/trips/${trip.id}`);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="weight">Peso cargado (kg)</Label>
                <Input id="weight" type="number" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="packages">Número de bultos</Label>
                <Input id="packages" type="number" required />
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Adjuntar fotografías de la carga
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">Estado de la mercadería</Label>
              <Input id="state" placeholder="Buen estado, sin daños visibles" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="confirm" required />
              <Label htmlFor="confirm" className="text-sm font-normal">Ambas partes confirman el recojo</Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea id="notes" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit">Confirmar recojo</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
