import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeUpdate } from "@/lib/format";

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[color:var(--info)]/10 px-2.5 py-1 text-xs font-medium text-[color:var(--info)]",
        className
      )}
      title="Confianza de la información disponible"
    >
      <Gauge className="size-3.5" />
      {confidence}% de confianza
    </span>
  );
}

export function FreshnessBadge({ updatedAt, className }: { updatedAt: string; className?: string }) {
  return (
    <span className={cn("text-xs text-muted-foreground", className)}>{formatRelativeUpdate(updatedAt)}</span>
  );
}
