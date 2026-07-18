"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, FileCheck2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VEHICLES } from "@/lib/mock/actors";
import { VEHICLE_LABELS } from "@/lib/mock/vehicle-labels";

const DOCUMENTS = ["Tarjeta de propiedad", "SOAT vigente", "Revisión técnica"];

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vehicle = VEHICLES.find((item) => item.id === id);
  const [available, setAvailable] = useState(vehicle?.available ?? false);

  if (!vehicle) notFound();

  return (
    <div className="space-y-6">
      <DesktopTopBar title={vehicle.label} description={`${VEHICLE_LABELS[vehicle.type]} · placa ${vehicle.plate}`} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
            <Image src={vehicle.photos[0]} alt={`${vehicle.label}, placa ${vehicle.plate}`} fill priority className="object-cover" />
            <Badge className="absolute left-4 top-4" variant={available ? "default" : "secondary"}>
              {available ? "Disponible" : "No disponible"}
            </Badge>
          </div>

          <Card>
            <CardHeader><CardTitle className="font-heading text-base">Características</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Detail label="Capacidad máxima" value={`${vehicle.capacityKg.toLocaleString("es-PE")} kg`} />
              <Detail label="Volumen útil" value={`${vehicle.capacityM3} m³`} />
              <Detail label="Cobertura" value={vehicle.covered ? "Carga cubierta" : "Carga abierta"} />
              <Detail label="Refrigeración" value={vehicle.refrigerated ? "Disponible" : "No disponible"} />
              <Detail label="Tracción 4x4" value={vehicle.is4x4 ? "Sí" : "No"} />
              <Detail label="Tipo" value={VEHICLE_LABELS[vehicle.type]} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader><CardTitle className="font-heading text-base">Documentos declarados</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {DOCUMENTS.map((document) => (
                <div key={document} className="flex items-center justify-between rounded-xl bg-muted/70 px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2"><FileCheck2 className="size-4 text-primary" /> {document}</span>
                  <Check className="size-4 text-primary" aria-label="Declarado" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 pt-6">
              <Button className="w-full" onClick={() => toast.success("Los datos del vehículo están listos para editar.")}>Editar vehículo</Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setAvailable((current) => !current);
                  toast.success(available ? "Vehículo marcado como no disponible." : "Vehículo disponible para nuevas cargas.");
                }}
              >
                Cambiar disponibilidad
              </Button>
              <Button variant="destructive" className="w-full gap-2" onClick={() => toast.error("Confirma la eliminación desde la gestión de flota.")}>
                <Trash2 className="size-4" /> Eliminar vehículo
              </Button>
            </CardContent>
          </Card>
          <Button asChild variant="ghost" className="w-full"><Link href="/vehicles">Volver a mi flota</Link></Button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
