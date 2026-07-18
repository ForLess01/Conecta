import { ExternalLink, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildOpenStreetMapEmbedUrl, buildOpenStreetMapLink } from "@/lib/maps/openstreetmap";

interface LocationMapProps {
  className?: string;
  label?: string;
  markers?: {
    label: string;
    latitude?: number;
    longitude?: number;
    risk?: "bajo" | "medio" | "alto" | "critico";
  }[];
}

const RISK_DOT: Record<string, string> = {
  bajo: "bg-[color:var(--risk-low)]",
  medio: "bg-[color:var(--risk-medium)]",
  alto: "bg-[color:var(--risk-high)]",
  critico: "bg-[color:var(--risk-critical)]",
};

export function LocationMap({ className, label = "Mapa de referencia", markers = [] }: LocationMapProps) {
  const locatedMarker = markers.find(
    (marker) => Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude)
  );
  const coordinates = locatedMarker
    ? { latitude: locatedMarker.latitude!, longitude: locatedMarker.longitude! }
    : undefined;

  return (
    <div
      className={cn(
        "relative min-h-64 overflow-hidden rounded-2xl border border-border bg-muted",
        className
      )}
    >
      <iframe
        src={buildOpenStreetMapEmbedUrl(coordinates)}
        title={label}
        loading="lazy"
        className="absolute inset-0 size-full border-0"
      />
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-card/95 px-3 py-2 text-xs font-medium text-card-foreground shadow-sm">
          <MapPin className="size-4" />
          {label}
        </div>
        <a
          href={buildOpenStreetMapLink(coordinates)}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg bg-card/95 px-3 py-2 text-xs font-medium text-card-foreground shadow-sm hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Abrir mapa
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap gap-2">
        {markers.map((marker) => (
          <span
            key={marker.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 text-xs text-card-foreground shadow-sm"
          >
            <span className={cn("size-2 rounded-full", marker.risk ? RISK_DOT[marker.risk] : "bg-primary")} />
            {marker.label}
          </span>
        ))}
      </div>
    </div>
  );
}
