import Link from "next/link";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TripRouteMap({ origin, destination }: { origin: string; destination: string }) {
  const searchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${origin} ${destination}`)}`;
  return <section aria-labelledby="trip-map-heading" className="overflow-hidden rounded-xl border border-border bg-card">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4"><div><h2 id="trip-map-heading" className="font-heading font-semibold">Ruta declarada</h2><p className="mt-1 text-xs text-muted-foreground">{origin} → {destination}</p></div><Button variant="outline" size="sm" asChild><Link href={searchUrl} target="_blank" rel="noreferrer">Abrir en OpenStreetMap <ExternalLink className="size-3.5" /></Link></Button></div>
    <div className="relative grid gap-8 bg-muted/40 p-8 sm:grid-cols-2"><div className="flex items-start gap-3"><Navigation className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">Recojo</p><p className="font-medium">{origin}</p></div></div><div className="flex items-start gap-3"><MapPin className="size-5 text-destructive" /><div><p className="text-xs text-muted-foreground">Entrega</p><p className="font-medium">{destination}</p></div></div></div>
  </section>;
}
