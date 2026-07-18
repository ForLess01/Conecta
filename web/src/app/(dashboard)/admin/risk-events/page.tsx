"use client";

import Link from "next/link";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPlaceholder } from "@/components/maps/map-placeholder";
import { RISK_EVENTS } from "@/lib/mock/risk";
import { formatDate } from "@/lib/format";

const EVENT_TYPE_LABEL: Record<string, string> = {
  bloqueo: "Bloqueo de vía",
  protesta: "Protesta",
  lluvia: "Lluvia intensa",
  accidente: "Accidente",
  via_restringida: "Vía restringida",
  puente_danado: "Puente dañado",
};

export default function AdminRiskEventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DesktopTopBar title="Gestión de eventos de riesgo" description="Eventos que alimentan el motor de riesgo territorial." />
        <Button asChild>
          <Link href="/admin/risk-events/new">Crear evento</Link>
        </Button>
      </div>

      <MapPlaceholder
        label="Todos los eventos de riesgo"
        markers={RISK_EVENTS.map((e) => ({ label: `${EVENT_TYPE_LABEL[e.type]} · ${e.location.district}` }))}
      />

      <div className="overflow-x-auto rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Lugar</TableHead>
              <TableHead>Severidad</TableHead>
              <TableHead>Confianza</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RISK_EVENTS.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{EVENT_TYPE_LABEL[event.type]}</TableCell>
                <TableCell>{event.location.district}</TableCell>
                <TableCell>
                  <Badge variant={event.severity >= 4 ? "destructive" : "secondary"}>{event.severity}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">{event.confidence}%</TableCell>
                <TableCell className="max-w-48 truncate text-xs text-muted-foreground">{event.source}</TableCell>
                <TableCell className="capitalize">{event.status}</TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button variant="ghost" size="sm" onClick={() => toast.success("Evento confirmado (demo).")}>
                    Confirmar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toast.info("Evento resuelto (demo).")}>
                    Resolver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">Última ejecución del análisis IA Gemini: {formatDate("2026-07-18")}</p>
    </div>
  );
}
