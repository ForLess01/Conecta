import Link from "next/link";
import Image from "next/image";
import type { Shipment } from "@/lib/server/shipments";
import { img, type ImageKey } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSoles, formatDate } from "@/lib/format";

const VEHICLE_IMAGE: ImageKey = "truck8t";

export function FreightCard({ freight }: { freight: Shipment }) {
  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative h-28">
        <Image
          src={img(VEHICLE_IMAGE, 800)}
          alt="Transporte de carga en ruta"
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>
      <div className="flex flex-col gap-3 p-4 pt-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-sm font-semibold">
            {freight.origin_label} → {freight.destination_label}
          </p>
          <p className="text-xs text-muted-foreground">{freight.cargo_description}</p>
        </div>
        <Badge variant="secondary" className="shrink-0">Carga abierta</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <span className="text-muted-foreground">Peso: <span className="font-medium text-foreground">{Number(freight.total_weight_kg ?? 0).toLocaleString("es-PE")} kg</span></span>
        <span className="text-muted-foreground">Fecha: <span className="font-medium text-foreground">{freight.scheduled_pickup_at ? formatDate(freight.scheduled_pickup_at) : "Por coordinar"}</span></span>
        <span className="text-muted-foreground">Bultos: <span className="font-medium text-foreground">{freight.package_count ?? "—"}</span></span>
        <span className="text-muted-foreground">Tarifa: <span className="font-medium text-foreground tabular-nums">{freight.suggested_fare ? formatSoles(Number(freight.suggested_fare)) : "A convenir"}</span></span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Solicitud verificada por acceso</span>
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
    </div>
  );
}
