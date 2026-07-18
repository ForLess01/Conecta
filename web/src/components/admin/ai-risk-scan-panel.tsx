"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RiskCandidate } from "@/lib/ai/schemas";

const PUNO_CORRIDORS = [
  "Ilave - Juliaca",
  "Acora - Puno",
  "Puno - Arequipa",
  "Juliaca - Arequipa",
  "Mazocruz - Ilave",
  "Juli - Puno",
] as const;

const EVENT_TYPE_LABEL: Record<RiskCandidate["eventType"], string> = {
  bloqueo: "Bloqueo de vía",
  protesta: "Protesta",
  lluvia: "Lluvia intensa",
  accidente: "Accidente",
  via_restringida: "Vía restringida",
  puente_danado: "Puente dañado",
};

const RISK_LEVEL_LABEL: Record<RiskCandidate["riskLevel"], string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
  critical: "Crítico",
};

type RiskAnalysisResponse = {
  run: {
    status: "completed" | "degraded";
    eventCount: number;
  };
  events: RiskCandidate[];
  freshness: {
    generatedAt: string;
    windowHours: number;
    cached: boolean;
  };
  source: "gemini" | "fallback" | "mixed";
};

const SOURCE_LABEL: Record<RiskAnalysisResponse["source"], string> = {
  gemini: "Gemini con búsqueda web",
  fallback: "Datos de respaldo",
  mixed: "Gemini y datos de respaldo",
};

export function AiRiskScanPanel({ initialCandidates = [] }: { initialCandidates?: RiskCandidate[] }) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<RiskCandidate[]>(initialCandidates);
  const [analysis, setAnalysis] = useState<RiskAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCandidateId, setPendingCandidateId] = useState<string | null>(null);

  async function analyzeRisks() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/risk/analyze", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: "Puno",
          corridors: PUNO_CORRIDORS,
          windowHours: 72,
          force: false,
        }),
      });

      if (!response.ok) {
        throw new Error(response.status === 403 ? "Tu cuenta no tiene el rol ADMIN en Supabase." : "No se pudo completar el análisis. Intentá nuevamente.");
      }

      const result = (await response.json()) as RiskAnalysisResponse;

      setAnalysis(result);
      setCandidates((current) => {
        const merged = new Map(current.map((candidate) => [candidate.id, candidate]));
        result.events.forEach((candidate) => merged.set(candidate.id, candidate));
        return Array.from(merged.values());
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  async function reviewCandidate(id: string, action: "confirm" | "discard") {
    setPendingCandidateId(id);
    try {
      const response = await fetch(`/api/risk/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error("No se pudo revisar el candidato.");
      setCandidates((current) => current.filter((candidate) => candidate.id !== id));
      router.refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "No se pudo revisar el candidato.");
    } finally {
      setPendingCandidateId(null);
    }
  }

  return (
    <section aria-labelledby="ai-risk-scan-title" className="space-y-4">
      <Card>
        <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle id="ai-risk-scan-title" className="flex items-center gap-2 font-heading text-lg">
              <Sparkles className="size-5 text-primary" aria-hidden="true" />
              Actualización asistida por Gemini
            </CardTitle>
            <CardDescription className="max-w-2xl">
              Busca señales públicas de las últimas 72 horas en seis corredores permitidos de Puno.
              Cada ejecución, candidato y cita se guarda para revisión y auditoría.
            </CardDescription>
          </div>
          <Button onClick={analyzeRisks} disabled={isLoading} className="shrink-0">
            {isLoading ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw aria-hidden="true" />
            )}
            {isLoading ? "Analizando riesgos…" : "Actualizar riesgos con Gemini"}
          </Button>
        </CardHeader>

        {(analysis || error) && (
          <CardContent className="space-y-4 border-t border-border pt-5">
            {error ? (
              <Alert variant="destructive">
                <AlertTriangle aria-hidden="true" />
                <AlertTitle>No se pudo actualizar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {analysis ? (
              <div className="flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
                <Badge variant={analysis.run.status === "completed" ? "default" : "secondary"}>
                  {analysis.run.status === "completed" ? "Análisis completado" : "Análisis degradado"}
                </Badge>
                <span className="text-muted-foreground">Fuente: {SOURCE_LABEL[analysis.source]}</span>
                <span className="text-muted-foreground" aria-hidden="true">·</span>
                <span className="text-muted-foreground">
                  Generado {formatGeneratedAt(analysis.freshness.generatedAt)}
                </span>
                <Badge variant="outline">
                  {analysis.freshness.cached ? "Resultado en caché" : "Resultado reciente"}
                </Badge>
                <Badge variant="outline">Ventana: {analysis.freshness.windowHours} h</Badge>
              </div>
            ) : null}
          </CardContent>
        )}
      </Card>

      {(analysis || candidates.length > 0) && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-heading text-base font-semibold">Candidatos detectados por IA</h2>
              <p className="text-sm text-muted-foreground">
                UNCONFIRMED · Requieren revisión y confirmación humana antes de convertirse en eventos.
              </p>
            </div>
            <Badge variant="outline">{candidates.length} pendientes</Badge>
          </div>

          {candidates.length === 0 ? (
            <Alert>
              <AlertTitle>Sin candidatos en esta ejecución</AlertTitle>
              <AlertDescription>
                No se encontraron señales públicas con citas verificables para la ventana consultada.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento candidato</TableHead>
                    <TableHead>Lugar</TableHead>
                    <TableHead>Severidad</TableHead>
                    <TableHead>Confianza</TableHead>
                    <TableHead>Citas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="min-w-64 max-w-md">
                        <p className="font-medium">{candidate.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {EVENT_TYPE_LABEL[candidate.eventType]} · {candidate.summary}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-40">
                        {candidate.location.route ?? candidate.location.district ?? candidate.location.region}
                      </TableCell>
                      <TableCell>
                        <Badge variant={candidate.severity >= 4 ? "destructive" : "secondary"}>
                          {candidate.severity}/5 · {RISK_LEVEL_LABEL[candidate.riskLevel]}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{candidate.confidence}%</TableCell>
                      <TableCell className="min-w-48">
                        <div className="flex flex-col items-start gap-1.5">
                          {candidate.citations.map((citation) => (
                            <a
                              key={citation.url}
                              href={citation.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex max-w-56 items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <span className="truncate">{citation.title}</span>
                              <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                            </a>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="space-x-1 text-right">
                        <Button size="sm" disabled={pendingCandidateId === candidate.id} onClick={() => reviewCandidate(candidate.id, "confirm")}>Confirmar</Button>
                        <Button size="sm" variant="ghost" disabled={pendingCandidateId === candidate.id} onClick={() => reviewCandidate(candidate.id, "discard")}>Descartar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <p className="text-xs text-muted-foreground">Los candidatos, citas y decisiones quedan registrados para auditoría.</p>
        </div>
      )}
    </section>
  );
}

function formatGeneratedAt(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "en una fecha no disponible";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}
