"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TYPES = [
  ["ROAD_BLOCK", "Bloqueo de vía"], ["PROTEST", "Protesta"], ["HEAVY_RAIN", "Lluvia intensa"],
  ["ACCIDENT", "Accidente"], ["ACCESS_DIFFICULTY", "Vía restringida"], ["ROAD_DAMAGE", "Daño de infraestructura"],
] as const;

export function RiskEventForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/risk/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        eventTypeCode: form.get("eventTypeCode"), title: form.get("title"), summary: form.get("summary") || null,
        roadName: form.get("roadName") || null, affectedRadiusKm: Number(form.get("affectedRadiusKm")),
        severity: Number(form.get("severity")), sourceConfidence: Number(form.get("sourceConfidence")),
        startsAt: localDate(form.get("startsAt")), endsAt: localDate(form.get("endsAt")), sourceUrl: form.get("sourceUrl") || null,
      }) });
      if (!response.ok) throw new Error("No se pudo guardar el evento.");
      toast.success("Evento de riesgo guardado.");
      router.push("/admin/risk-events");
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falló el registro."); }
    finally { setBusy(false); }
  }
  return <Card><CardContent className="pt-6"><form className="space-y-4" onSubmit={submit}>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Tipo"><select name="eventTypeCode" className="h-9 w-full rounded-md border bg-background px-3 text-sm">{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Vía o corredor"><Input name="roadName" maxLength={160} /></Field></div>
    <Field label="Título"><Input name="title" required minLength={4} maxLength={160} /></Field><Field label="Resumen"><Textarea name="summary" maxLength={600} /></Field>
    <div className="grid gap-4 sm:grid-cols-3"><Field label="Radio (km)"><Input name="affectedRadiusKm" type="number" min="0.1" max="1000" step="0.1" defaultValue="10" required /></Field><Field label="Severidad (1-5)"><Input name="severity" type="number" min="1" max="5" defaultValue="3" required /></Field><Field label="Confianza (%)"><Input name="sourceConfidence" type="number" min="0" max="100" defaultValue="70" required /></Field></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Inicio estimado"><Input name="startsAt" type="datetime-local" /></Field><Field label="Fin estimado"><Input name="endsAt" type="datetime-local" /></Field></div>
    <Field label="URL de la fuente"><Input name="sourceUrl" type="url" placeholder="https://..." /></Field>
    <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar evento"}</Button></div>
  </form></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }
function localDate(value: FormDataEntryValue | null) { return typeof value === "string" && value ? new Date(value).toISOString() : null; }
