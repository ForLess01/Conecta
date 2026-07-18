"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stepper } from "@/components/shared/stepper";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPlaceholder } from "@/components/maps/map-placeholder";

const STEPS = ["Identidad", "Ubicación", "Productos", "Capacidad", "Negociación", "Verificación"];

const CATALOG = ["Papa Canchán", "Papa Imilla", "Fibra de alpaca", "Quinua blanca", "Cebolla roja", "Trucha fresca"];

export default function ProducerOnboardingPage() {
  const [step, setStep] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const router = useRouter();
  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Configura tu perfil de productor</h1>
        <p className="mt-1 text-sm text-muted-foreground">Completa los 6 pasos para empezar a publicar productos.</p>
      </div>
      <Stepper steps={STEPS} currentStep={step} />

      <Card>
        <CardContent className="space-y-4 pt-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" placeholder="Nombre y apellidos" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" placeholder="9XX XXX XXX" />
              </div>
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Sube una foto de perfil
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <MapPlaceholder label="Selecciona tu ubicación aproximada" />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="district">Distrito</Label>
                  <Input id="district" placeholder="Acora" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="province">Provincia</Label>
                  <Input id="province" placeholder="Puno" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="region">Región</Label>
                  <Input id="region" placeholder="Puno" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Solo se mostrará tu ubicación aproximada; las coordenadas exactas nunca son públicas.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Label>Productos que ofreces</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {CATALOG.map((product) => (
                  <label
                    key={product}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
                  >
                    <Checkbox
                      checked={selectedProducts.includes(product)}
                      onCheckedChange={() =>
                        setSelectedProducts((prev) =>
                          prev.includes(product) ? prev.filter((p) => p !== product) : [...prev, product]
                        )
                      }
                    />
                    {product}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacidad productiva</Label>
                <Input id="capacity" type="number" placeholder="5000" />
              </div>
              <div className="space-y-1.5">
                <Label>Unidad</Label>
                <Select defaultValue="kg">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogramos</SelectItem>
                    <SelectItem value="t">Toneladas</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Aceptar negociación rápida</p>
                  <p className="text-xs text-muted-foreground">Ofertas con match inmediato si alcanzan tu mínimo privado.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-1.5">
                <Label>Ventana de negociación preferida</Label>
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

          {step === 5 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Declara los documentos con los que cuentas. Podrás subirlos después desde la verificación de perfil.
              </p>
              {["DNI", "Constancia de posesión o título", "Registro sanitario (si aplica)"].map((doc) => (
                <label key={doc} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm">
                  <Checkbox /> {doc}
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Atrás
          </Button>
          {!isLast && (
            <Button variant="outline" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Omitir paso
            </Button>
          )}
        </div>
        {isLast ? (
          <Button
            onClick={() => {
              toast.success("Perfil de productor configurado.");
              router.push("/verification");
            }}
          >
            Finalizar
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Siguiente</Button>
        )}
      </div>
    </div>
  );
}
