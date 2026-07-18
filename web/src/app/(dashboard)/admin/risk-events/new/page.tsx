"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPlaceholder } from "@/components/maps/map-placeholder";

export default function CreateRiskEventPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DesktopTopBar title="Crear evento de riesgo" description="Registra un evento que afecte el acceso o transporte de una zona." />
      <Card>
        <CardContent className="pt-6">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Evento de riesgo guardado.");
              router.push("/admin/risk-events");
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select defaultValue="protesta">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bloqueo">Bloqueo</SelectItem>
                    <SelectItem value="protesta">Protesta</SelectItem>
                    <SelectItem value="lluvia">Lluvia</SelectItem>
                    <SelectItem value="accidente">Accidente</SelectItem>
                    <SelectItem value="via_restringida">Vía restringida</SelectItem>
                    <SelectItem value="puente_danado">Puente dañado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="radius">Radio afectado (km)</Label>
                <Input id="radius" type="number" defaultValue={15} />
              </div>
            </div>

            <MapPlaceholder label="Ubicación del evento en el mapa" />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="severity">Severidad (1-5)</Label>
                <Input id="severity" type="number" min={1} max={5} defaultValue={3} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confidence">Confianza de la fuente (%)</Label>
                <Input id="confidence" type="number" min={0} max={100} defaultValue={70} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="start">Inicio estimado</Label>
                <Input id="start" type="datetime-local" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end">Fin estimado</Label>
                <Input id="end" type="datetime-local" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="source">Fuente y URLs</Label>
              <Input id="source" placeholder="Ej. Gremio de transportistas del Collao" />
            </div>

            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Adjuntar evidencia fotográfica
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit">Guardar evento</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
