"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Stepper } from "@/components/shared/stepper";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/marketplace/product-card";
import { PRODUCTS } from "@/lib/mock/products";

const STEPS = [
  "Producto",
  "Calidad",
  "Cantidad",
  "Fotografías",
  "Ubicación",
  "Negociación",
  "Logística",
  "Vista previa",
];

export default function PublishOfferPage() {
  const [step, setStep] = useState(0);
  const [quickEnabled, setQuickEnabled] = useState(true);
  const [conversationalEnabled, setConversationalEnabled] = useState(true);
  const router = useRouter();
  const previewProduct = PRODUCTS[0];

  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DesktopTopBar title="Publicar producto" description="Completa los 8 pasos para publicar tu producto en el marketplace." />
      <Stepper steps={STEPS} currentStep={step} />

      <Card>
        <CardContent className="space-y-4 pt-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Producto del catálogo</Label>
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
              <div className="space-y-1.5">
                <Label htmlFor="variety">Variedad</Label>
                <Input id="variety" placeholder="Ej. Canchán INIA" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="quality">Calidad y atributos</Label>
                <Textarea id="quality" placeholder="Primera calidad, calibre medio-grande…" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Cantidad disponible</Label>
                <Input id="quantity" type="number" defaultValue={1000} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Unidad</Label>
                <Input id="unit" defaultValue="kg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min">Pedido mínimo</Label>
                <Input id="min" type="number" defaultValue={100} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Arrastra fotografías o haz clic para subir (demo, sin almacenamiento real).
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="district">Distrito</Label>
                <Input id="district" defaultValue="Acora" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="province">Provincia</Label>
                <Input id="province" defaultValue="Puno" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="region">Región</Label>
                <Input id="region" defaultValue="Puno" />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Negociación rápida</p>
                  <p className="text-xs text-muted-foreground">Permite ofertas con reserva de 15 minutos.</p>
                </div>
                <Switch checked={quickEnabled} onCheckedChange={setQuickEnabled} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="floor">Mínimo privado por unidad</Label>
                <Input id="floor" type="number" step="0.01" placeholder="Ej. 1.35" />
                <p className="text-xs text-muted-foreground">
                  Este valor nunca será visible al comprador ni se mostrará cuánto faltó para alcanzarlo.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Negociación conversacional</p>
                  <p className="text-xs text-muted-foreground">Permite chat y propuestas estructuradas.</p>
                </div>
                <Switch checked={conversationalEnabled} onCheckedChange={setConversationalEnabled} />
              </div>
              <div className="space-y-1.5">
                <Label>Ventana de negociación</Label>
                <Select defaultValue="48">
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="48">48 horas</SelectItem>
                    <SelectItem value="72">72 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">Entrega propia</p>
                <p className="text-xs text-muted-foreground">¿Puedes entregar el producto tú mismo?</p>
              </div>
              <Switch defaultChecked />
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Vista previa de la tarjeta de tu producto:</p>
              <div className="max-w-xs">
                <ProductCard product={previewProduct} />
              </div>
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
              toast.success("Producto publicado (demo).");
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
