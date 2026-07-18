import { cn } from "@/lib/utils";
import { formatSoles } from "@/lib/format";
import type { PriceRange } from "@/types/domain";

export function PriceSuggestionBadge({
  range,
  className,
  compact = false,
}: {
  range: PriceRange;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("inline-flex flex-col gap-0.5", className)}>
      <span className="inline-flex items-baseline gap-1 tabular-nums">
        <span className="text-xs text-muted-foreground">Rango sugerido</span>
      </span>
      <span className="font-heading text-base font-semibold tabular-nums">
        {formatSoles(range.low)} – {formatSoles(range.high)}
        <span className="text-xs font-normal text-muted-foreground"> / {range.unit}</span>
      </span>
      {!compact && (
        <span className="text-xs text-muted-foreground">
          Referencia {formatSoles(range.central)} · no es un precio obligatorio
        </span>
      )}
    </div>
  );
}
