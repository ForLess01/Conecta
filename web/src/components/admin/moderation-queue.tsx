"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ModerationReport } from "@/lib/server/admin/data";

export function ModerationQueue({ reports }: { reports: ModerationReport[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  async function review(id: string, status: "DISMISSED" | "ACTIONED", action: "NONE" | "PAUSE_LISTING" | "CLOSE_LISTING") {
    const notes = window.prompt("Notas de moderación");
    if (notes === null) return;
    if (!notes.trim()) {
      toast.error("Ingresá una nota para justificar la decisión.");
      return;
    }
    setPending(id);
    try {
      const response = await fetch(`/api/admin/moderation/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, action, notes }) });
      if (!response.ok) throw new Error("No se pudo resolver el reporte.");
      toast.success(status === "DISMISSED" ? "Reporte descartado." : "Acción de moderación aplicada.");
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falló la moderación."); }
    finally { setPending(null); }
  }
  if (reports.length === 0) return <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No hay reportes pendientes.</p>;
  return <div className="space-y-3">{reports.map((report) => <Card key={report.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div className="max-w-xl"><div className="flex items-center gap-2"><p className="font-medium">{report.listingTitle}</p><Badge variant="secondary">{report.status}</Badge></div><p className="text-sm">{report.reason}</p>{report.details ? <p className="text-xs text-muted-foreground">{report.details}</p> : null}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={pending === report.id} onClick={() => review(report.id, "DISMISSED", "NONE")}>Descartar</Button><Button size="sm" disabled={pending === report.id} onClick={() => review(report.id, "ACTIONED", "PAUSE_LISTING")}>Pausar publicación</Button><Button size="sm" variant="destructive" disabled={pending === report.id} onClick={() => review(report.id, "ACTIONED", "CLOSE_LISTING")}>Cerrar publicación</Button></div></CardContent></Card>)}</div>;
}
