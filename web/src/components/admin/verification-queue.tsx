"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { VerificationRequest } from "@/lib/server/admin/data";

export function VerificationQueue({ requests }: { requests: VerificationRequest[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  async function review(id: string, status: "APPROVED" | "REJECTED" | "NEEDS_INFO") {
    setPending(id);
    try {
      const notes = status === "APPROVED" ? undefined : window.prompt("Notas para el solicitante") ?? undefined;
      const response = await fetch(`/api/admin/verification/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, notes }) });
      if (!response.ok) throw new Error("No se pudo revisar la solicitud.");
      toast.success(status === "APPROVED" ? "Usuario aprobado." : status === "REJECTED" ? "Solicitud rechazada." : "Se solicitaron más datos.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falló la revisión.");
    } finally { setPending(null); }
  }
  if (requests.length === 0) return <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No hay solicitudes pendientes.</p>;
  return <div className="space-y-3">{requests.map((request) => <Card key={request.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="text-sm font-medium">{request.actorName}</p><p className="text-xs text-muted-foreground">{request.actorKind === "ORGANIZATION" ? "Organización" : "Persona"} · Solicita {request.requestedStatus}</p><Badge variant="secondary">{request.documentCount} documentos</Badge></div><div className="flex gap-2"><Button size="sm" disabled={pending === request.id} onClick={() => review(request.id, "APPROVED")}>Aprobar</Button><Button size="sm" variant="outline" disabled={pending === request.id} onClick={() => review(request.id, "REJECTED")}>Rechazar</Button><Button size="sm" variant="ghost" disabled={pending === request.id} onClick={() => review(request.id, "NEEDS_INFO")}>Pedir más datos</Button></div></CardContent></Card>)}</div>;
}
