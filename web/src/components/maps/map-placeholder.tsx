import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapPlaceholderProps {
  className?: string;
  label?: string;
  markers?: { label: string; risk?: "bajo" | "medio" | "alto" | "critico" }[];
}

const RISK_DOT: Record<string, string> = {
  bajo: "bg-[color:var(--risk-low)]",
  medio: "bg-[color:var(--risk-medium)]",
  alto: "bg-[color:var(--risk-high)]",
  critico: "bg-[color:var(--risk-critical)]",
};

/**
 * Stylized placeholder standing in for a Mapbox panel in this prototype.
 * Renders a route-like grid with location markers so screens keep their
 * layout and information density without a real map integration.
 */
export function MapPlaceholder({ className, label = "Mapa de referencia (demo)", markers = [] }: MapPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-64 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,var(--secondary)_0%,var(--background)_60%)] p-4",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="size-4" />
        {label}
      </div>
      <div className="relative flex flex-wrap gap-2">
        {markers.map((marker) => (
          <span
            key={marker.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs shadow-sm"
          >
            <span className={cn("size-2 rounded-full", marker.risk ? RISK_DOT[marker.risk] : "bg-primary")} />
            {marker.label}
          </span>
        ))}
      </div>
    </div>
  );
}
