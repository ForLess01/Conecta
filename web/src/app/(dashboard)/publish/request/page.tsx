"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useRole } from "@/components/layout/role-context";
import { formatSoles } from "@/lib/format";
import { useSuggestedPriceRange } from "@/lib/pricing/use-suggested-price-range";
import type { ProductCategory } from "@/types/domain";

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

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  papa: "Papa",
  quinua: "Quinua",
  fibra_alpaca: "Fibra de alpaca",
  cebolla: "Cebolla",
  trucha: "Trucha",
};

const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" || value === undefined || value === null ? undefined : Number(value)),
  z.number().positive("Debe ser mayor a 0.").optional(),
);

const today = () => new Date(new Date().toDateString());

const requestFormSchema = z
  .object({
    category: z.enum(["papa", "quinua", "fibra_alpaca", "cebolla", "trucha"]),
    volume: z.coerce.number().positive("El volumen debe ser mayor a 0."),
    unit: z.string().trim().min(1, "Ingresa la unidad."),
    quality: z.string().trim().min(5, "Describe la calidad exigida."),
    initialPrice: optionalPositiveNumber,
    deadline: z.string().min(1, "Selecciona una fecha límite."),
    destination: z.string().trim().min(1, "Ingresa el destino."),
    acceptsPartial: z.boolean(),
    acceptsMultiple: z.boolean(),
    logisticsPreference: z.enum(["comprador", "productor", "marketplace"]),
  })
  .refine((data) => new Date(data.deadline) >= today(), {
    message: "La fecha límite no puede ser en el pasado.",
    path: ["deadline"],
  });

type RequestFormValues = z.infer<typeof requestFormSchema>;

const STEP_FIELDS: (keyof RequestFormValues)[][] = [
  ["category"],
  ["volume", "unit"],
  ["quality"],
  ["initialPrice"],
  ["deadline"],
  ["destination"],
  ["acceptsPartial", "acceptsMultiple"],
  ["logisticsPreference"],
  [],
];

const LOGISTICS_LABELS: Record<RequestFormValues["logisticsPreference"], string> = {
  comprador: "Recoge el comprador",
  productor: "Entrega el productor",
  marketplace: "Buscar transporte en marketplace",
};

export default function PublishRequestPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { currentActor } = useRole();

  const {
    control,
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      category: "papa",
      volume: 5000,
      unit: "kg",
      quality: "",
      initialPrice: undefined,
      deadline: "",
      destination: "Juliaca, Puno",
      acceptsPartial: true,
      acceptsMultiple: true,
      logisticsPreference: "marketplace",
    },
  });

  const isLast = step === STEPS.length - 1;
  const preview = watch();
  const suggestedRange = useSuggestedPriceRange(preview.category);

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const onSubmit = async (values: RequestFormValues) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingType: "REQUEST",
          actorId: currentActor.id,
          category: values.category,
          title: `${CATEGORY_LABELS[values.category]} — requerimiento`,
          description: values.quality,
          quantity: values.volume,
          unit: values.unit,
          acceptsPartialOffers: values.acceptsPartial,
          acceptsMultipleSuppliers: values.acceptsMultiple,
          // Deadline, destination, initial price and logistics preference are
          // persisted by dedicated endpoints once purchase_requests/location
          // wiring lands; not part of the base listing CRUD contract yet.
        }),
      });

      if (!response.ok) {
        throw new Error("request-failed");
      }

      toast.success("Requerimiento publicado.");
      router.push("/marketplace");
    } catch {
      toast.error("No se pudo publicar el requerimiento. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DesktopTopBar title="Publicar requerimiento" description="Completa los 9 pasos para publicar tu requerimiento de compra." />
      <Stepper steps={STEPS} currentStep={step} />

      <Card>
        <CardContent className="space-y-4 pt-6">
          {step === 0 && (
            <div className="space-y-1.5">
              <Label>Producto buscado</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="volume">Volumen total</Label>
                <Input id="volume" type="number" {...register("volume")} />
                {errors.volume && <p className="text-xs text-destructive">{errors.volume.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Unidad</Label>
                <Input id="unit" {...register("unit")} />
                {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-1.5">
              <Label htmlFor="quality">Calidad exigida</Label>
              <Input id="quality" placeholder="Primera calidad, calibre medio-grande" {...register("quality")} />
              {errors.quality && <p className="text-xs text-destructive">{errors.quality.message}</p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {suggestedRange && (
                <div className="rounded-xl bg-muted p-3 text-sm">
                  <p className="font-medium">
                    Referencia: {formatSoles(suggestedRange.low)} – {formatSoles(suggestedRange.high)} / {suggestedRange.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Central {formatSoles(suggestedRange.central)} · {suggestedRange.confidenceLabel} · {suggestedRange.basis} Es
                    solo una guía: el precio sigue siendo negociable.
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="price">Precio inicial referencial (opcional)</Label>
                <Input id="price" type="number" step="0.01" placeholder="S/ por unidad" {...register("initialPrice")} />
                {errors.initialPrice && <p className="text-xs text-destructive">{errors.initialPrice.message}</p>}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Fecha límite</Label>
              <Input id="deadline" type="date" {...register("deadline")} />
              {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="destination">Destino</Label>
                <Input id="destination" {...register("destination")} />
                {errors.destination && <p className="text-xs text-destructive">{errors.destination.message}</p>}
              </div>
              <MapPlaceholder label="Destino en el mapa" />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <p className="text-sm font-medium">Acepta oferta parcial</p>
                <Controller
                  control={control}
                  name="acceptsPartial"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <p className="text-sm font-medium">Acepta múltiples productores</p>
                <Controller
                  control={control}
                  name="acceptsMultiple"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-1.5">
              <Label>Logística preferida</Label>
              <Controller
                control={control}
                name="logisticsPreference"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprador">Recoge el comprador</SelectItem>
                      <SelectItem value="productor">Entrega el productor</SelectItem>
                      <SelectItem value="marketplace">Buscar transporte en marketplace</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {step === 8 && (
            <div className="space-y-2 rounded-xl bg-muted/60 p-4 text-sm">
              <p className="font-medium">Resumen del requerimiento</p>
              <p className="text-muted-foreground">
                {preview.volume} {preview.unit} de {CATEGORY_LABELS[preview.category]}, entrega en {preview.destination},{" "}
                {preview.acceptsPartial ? "acepta parcial" : "no acepta parcial"} y{" "}
                {preview.acceptsMultiple ? "acepta múltiples productores" : "requiere un solo productor"}.
                Logística: {LOGISTICS_LABELS[preview.logisticsPreference]}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Atrás
          </Button>
          <Button variant="outline" onClick={() => toast.info("Borrador guardado.")}>
            Guardar borrador
          </Button>
        </div>
        {isLast ? (
          <Button onClick={handleSubmit(onSubmit)} disabled={submitting}>
            {submitting ? "Publicando…" : "Publicar"}
          </Button>
        ) : (
          <Button onClick={goNext}>Siguiente</Button>
        )}
      </div>
    </div>
  );
}
