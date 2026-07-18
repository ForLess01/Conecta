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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/marketplace/product-card";
import { PRODUCTS } from "@/lib/mock/products";
import { useRole } from "@/components/layout/role-context";
import { formatSoles } from "@/lib/format";
import { useSuggestedPriceRange } from "@/lib/pricing/use-suggested-price-range";
import type { ProductCategory } from "@/types/domain";

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

const offerFormSchema = z
  .object({
    category: z.enum(["papa", "quinua", "fibra_alpaca", "cebolla", "trucha"]),
    variety: z.string().trim().min(1, "Ingresa la variedad."),
    quality: z.string().trim().min(10, "Describe la calidad con más detalle."),
    quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0."),
    unit: z.string().trim().min(1, "Ingresa la unidad."),
    minOrder: z.coerce.number().positive("El pedido mínimo debe ser mayor a 0."),
    district: z.string().trim().min(1, "Ingresa el distrito."),
    province: z.string().trim().min(1, "Ingresa la provincia."),
    region: z.string().trim().min(1, "Ingresa la región."),
    quickEnabled: z.boolean(),
    floorPrice: optionalPositiveNumber,
    conversationalEnabled: z.boolean(),
    negotiationWindowHours: z.number(),
    deliveryByProducer: z.boolean(),
  })
  .refine((data) => data.minOrder <= data.quantity, {
    message: "El pedido mínimo no puede superar la cantidad disponible.",
    path: ["minOrder"],
  })
  .refine((data) => !data.quickEnabled || data.floorPrice !== undefined, {
    message: "Define un mínimo privado para habilitar negociación rápida.",
    path: ["floorPrice"],
  });

type OfferFormValues = z.infer<typeof offerFormSchema>;

const STEP_FIELDS: (keyof OfferFormValues)[][] = [
  ["category", "variety"],
  ["quality"],
  ["quantity", "unit", "minOrder"],
  [],
  ["district", "province", "region"],
  ["quickEnabled", "floorPrice", "conversationalEnabled", "negotiationWindowHours"],
  ["deliveryByProducer"],
  [],
];

export default function PublishOfferPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { currentActor } = useRole();
  const previewProduct = PRODUCTS[0];

  const {
    control,
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      category: "papa",
      variety: "",
      quality: "",
      quantity: 1000,
      unit: "kg",
      minOrder: 100,
      district: "Acora",
      province: "Puno",
      region: "Puno",
      quickEnabled: true,
      floorPrice: undefined,
      conversationalEnabled: true,
      negotiationWindowHours: 48,
      deliveryByProducer: true,
    },
  });

  const isLast = step === STEPS.length - 1;
  const suggestedRange = useSuggestedPriceRange(watch("category"));

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const onSubmit = async (values: OfferFormValues) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingType: "OFFER",
          actorId: currentActor.id,
          category: values.category,
          title: `${CATEGORY_LABELS[values.category]} ${values.variety}`.trim(),
          description: values.quality,
          quantity: values.quantity,
          unit: values.unit,
          minimumOrderQuantity: values.minOrder,
          // Negotiation policy, private floor price and location are persisted
          // by a dedicated endpoint once offer_negotiation_policies/location
          // wiring lands; not part of the base listing CRUD contract yet.
        }),
      });

      if (!response.ok) {
        throw new Error("request-failed");
      }

      toast.success("Producto publicado.");
      router.push("/marketplace");
    } catch {
      toast.error("No se pudo publicar el producto. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

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
              <div className="space-y-1.5">
                <Label htmlFor="variety">Variedad</Label>
                <Input id="variety" placeholder="Ej. Canchán INIA" {...register("variety")} />
                {errors.variety && <p className="text-xs text-destructive">{errors.variety.message}</p>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="quality">Calidad y atributos</Label>
                <Textarea id="quality" placeholder="Primera calidad, calibre medio-grande…" {...register("quality")} />
                {errors.quality && <p className="text-xs text-destructive">{errors.quality.message}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Cantidad disponible</Label>
                <Input id="quantity" type="number" {...register("quantity")} />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Unidad</Label>
                <Input id="unit" {...register("unit")} />
                {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min">Pedido mínimo</Label>
                <Input id="min" type="number" {...register("minOrder")} />
                {errors.minOrder && <p className="text-xs text-destructive">{errors.minOrder.message}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Arrastra fotografías o haz clic para subir (disponible en una próxima iteración).
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="district">Distrito</Label>
                <Input id="district" {...register("district")} />
                {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="province">Provincia</Label>
                <Input id="province" {...register("province")} />
                {errors.province && <p className="text-xs text-destructive">{errors.province.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="region">Región</Label>
                <Input id="region" {...register("region")} />
                {errors.region && <p className="text-xs text-destructive">{errors.region.message}</p>}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              {suggestedRange && (
                <div className="rounded-xl bg-muted p-3 text-sm">
                  <p className="font-medium">
                    Referencia: {formatSoles(suggestedRange.low)} – {formatSoles(suggestedRange.high)} / {suggestedRange.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Central {formatSoles(suggestedRange.central)} · {suggestedRange.confidenceLabel} · {suggestedRange.basis} Es
                    solo una guía: vos decidís el precio final.
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Negociación rápida</p>
                  <p className="text-xs text-muted-foreground">Permite ofertas con reserva de 15 minutos.</p>
                </div>
                <Controller
                  control={control}
                  name="quickEnabled"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="floor">Mínimo privado por unidad</Label>
                <Input id="floor" type="number" step="0.01" placeholder="Ej. 1.35" {...register("floorPrice")} />
                <p className="text-xs text-muted-foreground">
                  Este valor nunca será visible al comprador ni se mostrará cuánto faltó para alcanzarlo.
                </p>
                {errors.floorPrice && <p className="text-xs text-destructive">{errors.floorPrice.message}</p>}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Negociación conversacional</p>
                  <p className="text-xs text-muted-foreground">Permite chat y propuestas estructuradas.</p>
                </div>
                <Controller
                  control={control}
                  name="conversationalEnabled"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ventana de negociación</Label>
                <Controller
                  control={control}
                  name="negotiationWindowHours"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
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
                  )}
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">Entrega propia</p>
                <p className="text-xs text-muted-foreground">¿Puedes entregar el producto tú mismo?</p>
              </div>
              <Controller
                control={control}
                name="deliveryByProducer"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
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
