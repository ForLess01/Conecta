"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, ExternalLink, KeyRound, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export function AiRiskScanPanel() {
  const [candidates, setCandidates] = useState<RiskCandidate[]>([]);
  const [analysis, setAnalysis] = useState<RiskAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminSessionRequired, setAdminSessionRequired] = useState(false);
  const [adminPassphrase, setAdminPassphrase] = useState("");
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

      if (response.status === 401) {
        setAdminSessionRequired(true);
        setAdminAuthError(null);
        return;
      }

      if (!response.ok) {
        throw new Error("No se pudo completar el análisis. Intentá nuevamente.");
      }

      const result = (await response.json()) as RiskAnalysisResponse;

      setAdminSessionRequired(false);
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

  async function establishAdminSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAuthenticating(true);
    setAdminAuthError(null);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: adminPassphrase }),
      });

      if (!response.ok) {
        setAdminAuthError(
          response.status === 503
            ? "La autenticación administrativa no está configurada en el servidor."
            : "La contraseña no es válida. Verificála e intentá nuevamente.",
        );
        return;
      }

      setAdminPassphrase("");
      setAdminSessionRequired(false);
      await analyzeRisks();
    } catch {
      setAdminAuthError("No se pudo iniciar la sesión administrativa. Intentá nuevamente.");
    } finally {
      setIsAuthenticating(false);
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
              Los resultados son candidatos temporales y no se guardan automáticamente.
            </CardDescription>
          </div>
          <Button onClick={analyzeRisks} disabled={isLoading || isAuthenticating} className="shrink-0">
            {isLoading ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw aria-hidden="true" />
            )}
            {isLoading ? "Analizando riesgos…" : "Actualizar riesgos con Gemini"}
          </Button>
        </CardHeader>

        {adminSessionRequired ? (
          <CardContent className="border-t border-border pt-5">
            <form onSubmit={establishAdminSession} className="max-w-md space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="admin-risk-passphrase" className="text-sm font-medium">
                  Contraseña de administrador
                </label>
                <Input
                  id="admin-risk-passphrase"
                  name="admin-passphrase"
                  type="password"
                  value={adminPassphrase}
                  onChange={(event) => setAdminPassphrase(event.target.value)}
                  autoComplete="current-password"
                  spellCheck={false}
                  placeholder="Ingresá la contraseña…"
                  aria-invalid={Boolean(adminAuthError)}
                  aria-describedby={adminAuthError ? "admin-risk-auth-error" : "admin-risk-auth-help"}
                  disabled={isAuthenticating}
                  required
                />
                {adminAuthError ? (
                  <p id="admin-risk-auth-error" className="text-sm text-destructive" role="alert">
                    {adminAuthError}
                  </p>
                ) : (
                  <p id="admin-risk-auth-help" className="text-xs text-muted-foreground">
                    La contraseña se envía solo para crear una sesión segura y no se guarda en el navegador.
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isAuthenticating || !adminPassphrase}>
                {isAuthenticating ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <KeyRound aria-hidden="true" />
                )}
                {isAuthenticating ? "Iniciando sesión…" : "Iniciar sesión y analizar"}
              </Button>
            </form>
          </CardContent>
        ) : null}

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
            <Badge variant="outline">{candidates.length} temporales</Badge>
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
                    <TableHead>Estado</TableHead>
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
                      <TableCell>
                        <Badge variant="outline">UNCONFIRMED</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Esta lista vive solo en la sesión actual del navegador. Confirmar un candidato requiere el flujo del backend.
          </p>
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
