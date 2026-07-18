"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Stepper } from "@/components/shared/stepper";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPlaceholder } from "@/components/maps/map-placeholder";

const STEPS = [
  "Producto",
  "Cantidad",
  "Calidad",
  "Precio inicial",
  "Fecha límite",
  "Destino",
  "Parcial/múltiples",
  "Logística",
  "Vista previa",
];

export default function PublishRequestPage() {
  const [step, setStep] = useState(0);
  const [acceptsPartial, setAcceptsPartial] = useState(true);
  const [acceptsMultiple, setAcceptsMultiple] = useState(true);
  const router = useRouter();
  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DesktopTopBar title="Publicar requerimiento" description="Completa los 9 pasos para publicar tu requerimiento de compra." />
      <Stepper steps={STEPS} currentStep={step} />

      <Card>
        <CardContent className="space-y-4 pt-6">
          {step === 0 && (
            <div className="space-y-1.5">
              <Label>Producto buscado</Label>
              <Select defaultValue="papa">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="papa">Papa</SelectItem>
                  <SelectItem value="quinua">Quinua</SelectItem>
                  <SelectItem value="fibra_alpaca">Fibra de alpaca</SelectItem>
                  <SelectItem value="cebolla">Cebolla</SelectItem>
                  <SelectItem value="trucha">Trucha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="volume">Volumen total</Label>
                <Input id="volume" type="number" defaultValue={5000} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Unidad</Label>
                <Input id="unit" defaultValue="kg" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-1.5">
              <Label htmlFor="quality">Calidad exigida</Label>
              <Input id="quality" placeholder="Primera calidad, calibre medio-grande" />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio inicial referencial (opcional)</Label>
              <Input id="price" type="number" step="0.01" placeholder="S/ por unidad" />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Fecha límite</Label>
              <Input id="deadline" type="date" />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="destination">Destino</Label>
                <Input id="destination" defaultValue="Juliaca, Puno" />
              </div>
              <MapPlaceholder label="Destino en el mapa" />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <p className="text-sm font-medium">Acepta oferta parcial</p>
                <Switch checked={acceptsPartial} onCheckedChange={setAcceptsPartial} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <p className="text-sm font-medium">Acepta múltiples productores</p>
                <Switch checked={acceptsMultiple} onCheckedChange={setAcceptsMultiple} />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-1.5">
              <Label>Logística preferida</Label>
              <Select defaultValue="marketplace">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprador">Recoge el comprador</SelectItem>
                  <SelectItem value="productor">Entrega el productor</SelectItem>
                  <SelectItem value="marketplace">Buscar transporte en marketplace</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-2 rounded-xl bg-muted/60 p-4 text-sm">
              <p className="font-medium">Resumen del requerimiento</p>
              <p className="text-muted-foreground">5000 kg de papa, entrega en Juliaca, acepta parcial y múltiples productores.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Atrás
          </Button>
          <Button variant="outline" onClick={() => toast.info("Borrador guardado (demo).")}>
            Guardar borrador
          </Button>
        </div>
        {isLast ? (
          <Button
            onClick={() => {
              toast.success("Requerimiento publicado (demo).");
              router.push("/marketplace");
            }}
          >
            Publicar
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Siguiente</Button>
        )}
      </div>
    </div>
  );
}
