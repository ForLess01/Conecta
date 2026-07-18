"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RiskEventRecord } from "@/lib/server/risk/events";

export function RiskEventsTable({ events }: { events: RiskEventRecord[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function update(id: string, status: "CONFIRMED" | "RESOLVED") {
    setPendingId(id);
    try {
      const response = await fetch(`/api/risk/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("No se pudo actualizar el evento.");
      toast.success(status === "CONFIRMED" ? "Evento confirmado." : "Evento resuelto.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falló la actualización.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <Table>
        <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Lugar</TableHead><TableHead>Severidad</TableHead><TableHead>Confianza</TableHead><TableHead>Fuentes</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell><p className="font-medium">{event.typeName}</p><p className="text-xs text-muted-foreground">{event.title}</p></TableCell>
              <TableCell>{event.roadName ?? "Sin vía específica"}</TableCell>
              <TableCell><Badge variant={event.severity >= 4 ? "destructive" : "secondary"}>{event.severity}/5</Badge></TableCell>
              <TableCell className="tabular-nums">{event.confidence}%</TableCell>
              <TableCell>{event.citations.length}</TableCell>
              <TableCell><Badge variant="outline">{event.status}</Badge></TableCell>
              <TableCell className="space-x-1 text-right">
                {event.status === "UNCONFIRMED" ? <Button variant="ghost" size="sm" disabled={pendingId === event.id} onClick={() => update(event.id, "CONFIRMED")}>Confirmar</Button> : null}
                {!(["RESOLVED", "DISCARDED", "STALE"].includes(event.status)) ? <Button variant="ghost" size="sm" disabled={pendingId === event.id} onClick={() => update(event.id, "RESOLVED")}>Resolver</Button> : null}
              </TableCell>
            </TableRow>
          ))}
          {events.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No hay eventos registrados.</TableCell></TableRow> : null}
        </TableBody>
      </Table>
    </div>
  );
}
