"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getFreightById } from "@/lib/mock/logistics";
import { VEHICLES } from "@/lib/mock/actors";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPlaceholder } from "@/components/maps/map-placeholder";
import { RiskBadge } from "@/components/marketplace/risk-badge";
import { ConfidenceBadge, FreshnessBadge } from "@/components/marketplace/confidence-badge";
import { formatSoles } from "@/lib/format";
import { VEHICLE_LABELS } from "@/lib/mock/vehicle-labels";

export default function FreightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const freight = getFreightById(id);
  const router = useRouter();
  const [rate, setRate] = useState(freight?.suggestedRate ?? 0);

  if (!freight) notFound();

  return (
    <div className="space-y-6">
      <DesktopTopBar
        title={`${freight.origin.district} → ${freight.destination.district}`}
        description={`${freight.distanceKm} km · Solicitud ${freight.id.toUpperCase()}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <MapPlaceholder
            label="Ruta con paradas"
            markers={[
              { label: `Recojo: ${freight.origin.district}` },
              { label: `Destino: ${freight.destination.district}` },
            ]}
            className="min-h-56"
          />

          <Card>
            <CardContent className="space-y-3 pt-6">
              <h3 className="font-heading text-base font-semibold">Detalle de la carga</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <InfoBlock label="Producto" value={freight.cargoDescription} />
                <InfoBlock label="Peso" value={`${freight.weightKg.toLocaleString("es-PE")} kg`} />
                <InfoBlock label="Volumen" value={`${freight.volumeM3} m3`} />
                <InfoBlock label="Bultos" value={String(freight.packages)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-semibold">Tarifa y riesgo</h3>
                <Link href={`/risk/${freight.id}`} className="text-xs text-primary hover:underline">
                  Ver riesgo completo
                </Link>
              </div>
              <p className="font-heading text-xl font-semibold tabular-nums">{formatSoles(freight.suggestedRate)}</p>
              <p className="text-xs text-muted-foreground">Tarifa inicial sugerida, editable en tu oferta.</p>
              <div className="flex flex-wrap items-center gap-2">
                <RiskBadge level={freight.risk.level} score={freight.risk.score} />
                <ConfidenceBadge confidence={freight.risk.confidence} />
                <FreshnessBadge updatedAt={freight.risk.updatedAt} />
              </div>
              <p className="text-xs text-muted-foreground">{freight.risk.reason}</p>
            </CardContent>
          </Card>
        </div>

        <Card id="ofertar" className="lg:sticky lg:top-20 lg:self-start">
          <CardContent className="pt-6">
            <h3 className="mb-4 font-heading text-base font-semibold">Enviar oferta de flete</h3>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Oferta de flete enviada (demo).");
                router.push(`/transport/${freight.id}/compare`);
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="rate">Tarifa propuesta</Label>
                <Input id="rate" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Vehículo de mi flota</Label>
                <Select defaultValue={VEHICLES[0].id}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLES.filter((v) => v.available).map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {VEHICLE_LABELS[vehicle.type]} — {vehicle.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="departure">Fecha y hora de salida</Label>
                  <Input id="departure" type="datetime-local" defaultValue={`${freight.requiredDate}T05:00`} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duration">Duración estimada (h)</Label>
                  <Input id="duration" type="number" defaultValue={4} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="helper" />
                <Label htmlFor="helper" className="text-sm font-normal">Incluye ayudante</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="insurance" defaultChecked />
                <Label htmlFor="insurance" className="text-sm font-normal">Incluye cobertura de seguro</Label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="conditions">Condiciones adicionales</Label>
                <Textarea id="conditions" placeholder="Forma de pago, horario, contacto…" />
              </div>
              <p className="text-xs text-muted-foreground">Nota: solo se admite una contraoferta por parte del solicitante.</p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost">Cancelar</Button>
                <Button type="submit">Enviar oferta</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
