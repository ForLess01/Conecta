import Link from "next/link";
import type { FreightRequest } from "@/types/domain";
import { RiskBadge } from "@/components/marketplace/risk-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSoles, formatDate } from "@/lib/format";
import { VEHICLE_LABELS } from "@/lib/mock/vehicle-labels";

export function FreightCard({ freight }: { freight: FreightRequest }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-sm font-semibold">
            {freight.origin.district} → {freight.destination.district}
          </p>
          <p className="text-xs text-muted-foreground">{freight.distanceKm} km · {freight.cargoDescription}</p>
        </div>
        {freight.returnLoadAvailable && (
          <Badge variant="secondary" className="shrink-0">Retorno disponible</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <span className="text-muted-foreground">Peso: <span className="font-medium text-foreground">{freight.weightKg.toLocaleString("es-PE")} kg</span></span>
        <span className="text-muted-foreground">Fecha: <span className="font-medium text-foreground">{formatDate(freight.requiredDate)}</span></span>
        <span className="text-muted-foreground">Vehículo: <span className="font-medium text-foreground">{VEHICLE_LABELS[freight.suggestedVehicle]}</span></span>
        <span className="text-muted-foreground">Tarifa: <span className="font-medium text-foreground tabular-nums">{formatSoles(freight.suggestedRate)}</span></span>
      </div>

      <div className="flex items-center justify-between">
        <RiskBadge level={freight.risk.level} score={freight.risk.score} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/transport/${freight.id}`}>Ver detalle</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/transport/${freight.id}#ofertar`}>Ofertar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
