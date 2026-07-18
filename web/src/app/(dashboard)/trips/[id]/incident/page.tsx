"use client";

import { use, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { toast } from "sonner";
import { getTripById } from "@/lib/mock/logistics";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPES = ["Retraso", "Vía bloqueada", "Avería", "Diferencia de peso", "Daño", "Rechazo", "Otro"];

export default function ReportIncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trip = getTripById(id);
  const router = useRouter();
  const [type, setType] = useState(TYPES[0]);
  if (!trip) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <DesktopTopBar title="Reportar incidencia" description={trip.cargoDescription} />
      <Card>
        <CardContent className="pt-6">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Incidencia reportada (demo).");
              router.push(`/trips/${trip.id}`);
            }}
          >
            <div className="space-y-1.5">
              <Label>Tipo de incidencia</Label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      type === t ? "border-primary bg-secondary" : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" required placeholder="Describe qué ocurrió…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Ubicación</Label>
              <Input id="location" placeholder="Km de referencia o distrito" />
            </div>
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Adjuntar fotografías (demo)
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit">Enviar reporte</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
