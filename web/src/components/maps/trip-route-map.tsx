import Link from "next/link";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import type { Location } from "@/types/domain";
import { Button } from "@/components/ui/button";

interface TripRouteMapProps {
  origin: Location;
  destination: Location;
  distanceKm: number;
  stops: string[];
}

export function TripRouteMap({ origin, destination, distanceKm, stops }: TripRouteMapProps) {
  const padding = 0.18;
  const minLng = Math.min(origin.lng, destination.lng) - padding;
  const maxLng = Math.max(origin.lng, destination.lng) + padding;
  const minLat = Math.min(origin.lat, destination.lat) - padding;
  const maxLat = Math.max(origin.lat, destination.lat) + padding;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(`${minLng},${minLat},${maxLng},${maxLat}`)}&layer=mapnik&marker=${destination.lat},${destination.lng}`;
  const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.lat}%2C${origin.lng}%3B${destination.lat}%2C${destination.lng}`;

  return (
    <section aria-labelledby="trip-map-heading" className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 id="trip-map-heading" className="font-heading text-base font-semibold">Mapa geográfico de la ruta</h2>
          <p className="mt-1 text-xs text-muted-foreground">{origin.district} → {destination.district} · {distanceKm} km</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={directionsUrl} target="_blank" rel="noreferrer">Abrir ruta <ExternalLink className="size-3.5" aria-hidden="true" /></Link>
        </Button>
      </div>
      <iframe
        title={`Mapa de ${origin.district} a ${destination.district}`}
        src={embedUrl}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-72 w-full border-0"
      />
      <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2">
        <div className="flex items-start gap-2"><Navigation className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Origen</p><p className="text-sm font-medium">{origin.district}, {origin.region}</p></div></div>
        <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 text-destructive" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Destino</p><p className="text-sm font-medium">{destination.district}, {destination.region}</p></div></div>
        <p className="text-xs text-muted-foreground sm:col-span-2">Paradas: {stops.join(" · ")}</p>
      </div>
    </section>
  );
}
