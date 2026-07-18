"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { getTripById, getFreightById } from "@/lib/mock/logistics";
import { VEHICLES } from "@/lib/mock/actors";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPlaceholder } from "@/components/maps/map-placeholder";
import { RiskBadge } from "@/components/marketplace/risk-badge";
import { formatDateTime } from "@/lib/format";
import { VEHICLE_LABELS } from "@/lib/mock/vehicle-labels";
import { Check, Circle, Phone } from "lucide-react";
import { useRole } from "@/components/layout/role-context";

const STATUS_LABEL: Record<string, string> = {
  programado: "Programado",
  recojo: "Recojo",
  en_transito: "En tránsito",
  demorado: "Demorado",
  entregado: "Entregado",
};

export default function TripTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trip = getTripById(id);
  const { activeRole } = useRole();

  if (!trip) notFound();

  const freight = getFreightById(trip.freightRequestId);
  const vehicle = VEHICLES.find((v) => v.id === trip.vehicleId);

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Seguimiento del viaje" description={trip.cargoDescription} />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <MapPlaceholder
            label="Ruta del viaje"
            markers={trip.stops.map((s) => ({ label: s.label }))}
            className="min-h-56"
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-semibold">Línea de tiempo</h3>
                <Badge>{STATUS_LABEL[trip.status]}</Badge>
              </div>
              <ol className="space-y-3">
                {trip.timeline.map((event) => (
                  <li key={event.at} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{event.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(event.at)}</p>
                    </div>
                  </li>
                ))}
                <li className="flex items-start gap-3 text-muted-foreground">
                  <Circle className="mt-0.5 size-4" />
                  <p className="text-sm">Entregado</p>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 pt-6">
              <h3 className="font-heading text-base font-semibold">Paradas</h3>
              {trip.stops.map((stop) => (
                <div key={stop.label} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm">
                  <span className={stop.done ? "" : "text-muted-foreground"}>{stop.label}</span>
                  {stop.done ? <Check className="size-4 text-primary" /> : <Circle className="size-4 text-muted-foreground" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <p className="text-xs font-medium text-muted-foreground">Conductor y vehículo</p>
              <p className="text-sm font-medium">{trip.driverName}</p>
              <p className="text-xs text-muted-foreground">
                {vehicle ? `${VEHICLE_LABELS[vehicle.type]} · ${vehicle.plate}` : "—"}
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => toast.info("Llamando al conductor (demo).")}>
                <Phone className="size-4" /> Contactar conductor
              </Button>
            </CardContent>
          </Card>

          {freight && (
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p className="text-xs font-medium text-muted-foreground">Riesgo activo en la ruta</p>
                <RiskBadge level={freight.risk.level} score={freight.risk.score} />
                <p className="text-xs text-muted-foreground">{freight.risk.reason}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-2 pt-6">
              {activeRole === "transportista" && (
                <Button className="w-full" onClick={() => toast.success("Estado actualizado (demo).")}>
                  Actualizar estado
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/trips/${trip.id}/pickup`}>Registrar recojo</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/trips/${trip.id}/delivery`}>Registrar entrega</Link>
                </Button>
              </div>
              <Button variant="ghost" size="sm" asChild className="w-full">
                <Link href={`/trips/${trip.id}/incident`}>Reportar incidencia</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
