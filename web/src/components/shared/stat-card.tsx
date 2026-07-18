import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: { direction: "up" | "down" | "flat"; label: string };
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground shrink-0">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 font-heading text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {(hint || trend) && (
        <div className="mt-1 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.direction === "up" && "text-primary",
                trend.direction === "down" && "text-destructive",
                trend.direction === "flat" && "text-muted-foreground"
              )}
            >
              {trend.label}
            </span>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}
