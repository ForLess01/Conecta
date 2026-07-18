import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/domain";

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  bajo: { bg: "bg-[color:var(--risk-low)]/10", text: "text-[color:var(--risk-low)]", label: "Riesgo bajo" },
  medio: { bg: "bg-[color:var(--risk-medium)]/15", text: "text-[color:var(--risk-medium)]", label: "Riesgo medio" },
  alto: { bg: "bg-[color:var(--risk-high)]/15", text: "text-[color:var(--risk-high)]", label: "Riesgo alto" },
  critico: { bg: "bg-[color:var(--risk-critical)]/15", text: "text-[color:var(--risk-critical)]", label: "Riesgo crítico" },
};

export function RiskBadge({
  level,
  score,
  className,
  showScore = true,
}: {
  level: RiskLevel;
  score?: number;
  className?: string;
  showScore?: boolean;
}) {
  const style = RISK_STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
      title="Riesgo actual de acceso y transporte"
    >
      <AlertTriangle className="size-3.5" />
      {style.label}
      {showScore && typeof score === "number" && <span className="tabular-nums">· {score}</span>}
    </span>
  );
}
