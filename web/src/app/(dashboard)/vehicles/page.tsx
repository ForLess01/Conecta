"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VEHICLES } from "@/lib/mock/actors";
import { VEHICLE_LABELS } from "@/lib/mock/vehicle-labels";

export default function VehiclesPage() {
  const available = VEHICLES.filter((vehicle) => vehicle.available).length;

  return (
    <div className="space-y-6">
      <DesktopTopBar
        title="Mi flota"
        description={`${VEHICLES.length} vehículos registrados · ${available} disponibles para nuevas cargas`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Mantén la capacidad y disponibilidad al día para recibir cargas compatibles con cada vehículo.
        </p>
        <Button className="gap-2" onClick={() => toast.info("El registro de un nuevo vehículo estará disponible en esta sección.")}>
          <Plus className="size-4" /> Registrar vehículo
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {VEHICLES.map((vehicle) => (
          <Card key={vehicle.id} className="overflow-hidden">
            <div className="relative aspect-[16/9] bg-muted">
              {vehicle.photos[0] ? (
                <Image
                  src={vehicle.photos[0]}
                  alt={`${vehicle.label}, placa ${vehicle.plate}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-primary"><Truck className="size-10" /></div>
              )}
              <Badge className="absolute left-3 top-3" variant={vehicle.available ? "default" : "secondary"}>
                {vehicle.available ? "Disponible" : "En operación"}
              </Badge>
            </div>
            <CardContent className="space-y-4 pt-5">
              <div>
                <h2 className="font-heading font-semibold">{vehicle.label}</h2>
                <p className="text-sm text-muted-foreground">{VEHICLE_LABELS[vehicle.type]} · {vehicle.plate}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <VehicleMetric label="Capacidad" value={`${vehicle.capacityKg.toLocaleString("es-PE")} kg`} />
                <VehicleMetric label="Volumen" value={`${vehicle.capacityM3} m³`} />
              </dl>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/vehicles/${vehicle.id}`}>Ver vehículo</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VehicleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/70 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
