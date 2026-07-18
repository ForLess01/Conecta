"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stepper } from "@/components/shared/stepper";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocationMap } from "@/components/maps/location-map";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { completeOnboardingAction } from "../actions";

const STEPS = ["Tipo", "Organización", "Productos", "Destinos", "Frecuencia", "Facturación"];

const BUYER_TYPES = ["Restaurante", "Acopiador", "Transformador", "Comercio minorista"];
const CATALOG = ["Papa", "Quinua", "Fibra de alpaca", "Cebolla", "Trucha"];

export default function BuyerOnboardingPage() {
  const [step, setStep] = useState(0);
  const [buyerType, setBuyerType] = useState<string | null>(null);
  const [organization, setOrganization] = useState("");
  const [ruc, setRuc] = useState("");
  const [products, setProducts] = useState<string[]>([]);
  const [destination, setDestination] = useState("");
  const [frequency, setFrequency] = useState("semanal");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Configura tu perfil de comprador</h1>
        <p className="mt-1 text-sm text-muted-foreground">Completa los 6 pasos para empezar a comprar.</p>
      </div>
      <Stepper steps={STEPS} currentStep={step} />

      <Card>
        <CardContent className="space-y-4 pt-6">
          {step === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {BUYER_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBuyerType(type)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                    buyerType === type ? "border-primary bg-secondary" : "border-border bg-card hover:bg-muted"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="org">Empresa u organización</Label>
                 <Input id="org" placeholder="Nombre comercial" value={organization} onChange={(event) => setOrganization(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ruc">RUC (opcional)</Label>
                 <Input id="ruc" placeholder="20XXXXXXXXX" value={ruc} onChange={(event) => setRuc(event.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Label>Productos que buscas</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {CATALOG.map((product) => (
                  <label key={product} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm">
                    <Checkbox checked={products.includes(product)} onCheckedChange={() => setProducts((current) => current.includes(product) ? current.filter((item) => item !== product) : [...current, product])} /> {product}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <LocationMap label="Marca tus destinos de entrega" markers={[{ label: "Juliaca" }, { label: "Arequipa" }]} />
              <div className="space-y-1.5">
                <Label htmlFor="destination">Destino principal</Label>
                <Input id="destination" placeholder="Juliaca, Puno" value={destination} onChange={(event) => setDestination(event.target.value)} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-1.5">
              <Label>Frecuencia de compra</Label>
              <Select value={frequency} onValueChange={(value) => value && setFrequency(value)}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diaria">Diaria</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3 rounded-xl bg-muted/60 p-4">
              <Badge variant="secondary">Próximamente</Badge>
              <div>
                <h2 className="font-heading font-semibold">Facturación</h2>
                <p className="mt-1 text-sm text-muted-foreground">No necesitas registrar datos fiscales para completar tu perfil. Esta función se habilitará en una siguiente etapa.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Atrás
        </Button>
        {isLast ? (
          <Button
             disabled={isPending}
             onClick={() => startTransition(async () => {
               try {
                 await completeOnboardingAction({ role: "comprador", details: { buyerType, organization, ruc, products, destination, frequency } });
                 toast.success("Perfil de comprador configurado.");
                 router.push("/verification");
               } catch (error) {
                 toast.error(error instanceof Error ? error.message : "No se pudo guardar el perfil.");
               }
             })}
          >
             {isPending ? "Guardando..." : "Finalizar"}
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Siguiente</Button>
        )}
      </div>
    </div>
  );
}
