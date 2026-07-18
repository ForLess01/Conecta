"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RiskBadge } from "@/components/marketplace/risk-badge";
import { MapPlaceholder } from "@/components/maps/map-placeholder";

export default function CreateFreightRequestPage() {
  const router = useRouter();
  const [rate, setRate] = useState(850);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DesktopTopBar title="Crear solicitud de transporte" description="Completa los datos de la carga para publicarla en el marketplace de fletes." />

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Solicitud de transporte publicada.");
          router.push("/transport");
        }}
      >
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="origin">Punto de recojo</Label>
                <Input id="origin" defaultValue="Acora, Puno" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="destination">Destino</Label>
                <Input id="destination" defaultValue="Juliaca, Puno" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input id="weight" type="number" defaultValue={4200} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="volume">Volumen (m3)</Label>
                <Input id="volume" type="number" defaultValue={14} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="packages">Número de bultos</Label>
                <Input id="packages" type="number" defaultValue={84} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Fecha requerida</Label>
                <Input id="date" type="date" defaultValue="2026-07-21" required />
              </div>
            </div>
            <MapPlaceholder label="Ruta estimada Acora → Juliaca (118 km)" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1.5">
              <Label>Vehículo sugerido por el sistema</Label>
              <p className="rounded-xl bg-muted px-3 py-2 text-sm">Camión 8 toneladas — según peso y volumen declarados</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rate">Tarifa inicial sugerida (editable)</Label>
              <Input id="rate" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Riesgo de ruta previo</span>
              <RiskBadge level="medio" score={38} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="helper" defaultChecked />
              <Label htmlFor="helper" className="text-sm font-normal">Requiere ayudante para carga y descarga</Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea id="notes" placeholder="Responsable de carga y descarga, horarios, contacto en destino…" />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost">Cancelar</Button>
          <Button type="button" variant="outline">Guardar borrador</Button>
          <Button type="submit">Publicar solicitud</Button>
        </div>
      </form>
    </div>
  );
}
