import { ExternalLink } from "lucide-react";
import type { RiskInfo } from "@/types/domain";
import { RiskBadge } from "@/components/marketplace/risk-badge";
import { ConfidenceBadge, FreshnessBadge } from "@/components/marketplace/confidence-badge";
import { formatSoles } from "@/lib/format";

export function RiskBreakdown({ risk }: { risk: RiskInfo }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={risk.level} score={risk.score} />
          <ConfidenceBadge confidence={risk.confidence} />
        </div>
        <FreshnessBadge updatedAt={risk.updatedAt} />
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Puntaje de riesgo</span>
          <span className="tabular-nums">{risk.score}/100</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[color:var(--risk-medium)]"
            style={{ width: `${risk.score}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{risk.reason}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {risk.factors.map((factor) => (
          <div key={factor.label} className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs font-medium">{factor.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{factor.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">Ruta alternativa disponible</p>
          <p className="text-sm font-medium">{risk.alternativeRouteAvailable ? "Sí" : "No"}</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">Retraso estimado / costo adicional</p>
          <p className="text-sm font-medium tabular-nums">
            {risk.estimatedDelayHours ?? 0} h · {formatSoles(risk.estimatedExtraCostSoles ?? 0)}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Fuentes citadas</p>
        {risk.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" />
            {source.label}
          </a>
        ))}
      </div>
    </div>
  );
}
