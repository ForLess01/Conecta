"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { getProductById } from "@/lib/mock/products";
import { getFreightById } from "@/lib/mock/logistics";
import { RISK_EVENTS } from "@/lib/mock/risk";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { RiskBreakdown } from "@/components/risk/risk-breakdown";
import { MapPlaceholder } from "@/components/maps/map-placeholder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const EVENT_TYPE_LABEL: Record<string, string> = {
  bloqueo: "Bloqueo de vía",
  protesta: "Protesta",
  lluvia: "Lluvia intensa",
  accidente: "Accidente",
  via_restringida: "Vía restringida",
  puente_danado: "Puente dañado",
};

export default function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProductById(id);
  const freight = getFreightById(id);
  const risk = product?.risk ?? freight?.risk;
  const [altRoute, setAltRoute] = useState(false);

  if (!risk) notFound();

  const location = product?.location ?? freight?.origin;

  return (
    <div className="space-y-6">
      <DesktopTopBar
        title="Detalle de riesgo"
        description="El riesgo se refiere siempre al acceso y transporte de la zona, nunca a la reputación de una persona."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <RiskBreakdown risk={risk} />

        <div className="space-y-4">
          <MapPlaceholder
            label={altRoute ? "Ruta alternativa (punteada)" : "Ruta principal trazada"}
            markers={[
              ...(location ? [{ label: `${location.district}, ${location.region}` }] : []),
              ...RISK_EVENTS.map((e) => ({ label: EVENT_TYPE_LABEL[e.type], risk: undefined })),
            ]}
            className="min-h-56"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setAltRoute((v) => !v)}>
              Alternar ruta
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Análisis actualizado.")}
            >
              Actualizar análisis
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast.info("Reporte de estado de vía enviado.")}>
              Reportar estado de vía
            </Button>
          </div>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <h3 className="font-heading text-base font-semibold">Eventos cercanos</h3>
              {RISK_EVENTS.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{EVENT_TYPE_LABEL[event.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.location.district} · radio {event.radiusKm} km
                    </p>
                  </div>
                  <Badge variant={event.severity >= 4 ? "destructive" : "secondary"}>Severidad {event.severity}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
