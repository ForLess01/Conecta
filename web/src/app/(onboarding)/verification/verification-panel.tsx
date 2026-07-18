"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { submitVerificationAction } from "../actions";

const LEVELS = [
  { name: "Básico", detail: "Identidad declarada. Puedes explorar y conversar." },
  { name: "Verificado", detail: "Documentos validados. Puedes publicar y cerrar operaciones." },
  { name: "Confiable", detail: "Historial de operaciones completadas sin incidencias." },
];

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING: { label: "En revisión", variant: "secondary" },
  NEEDS_INFO: { label: "Requiere información", variant: "destructive" },
  APPROVED: { label: "Aprobada", variant: "default" },
  REJECTED: { label: "Rechazada", variant: "destructive" },
};

interface VerificationState {
  level: string | null;
  requestId: string | null;
  requestStatus: string | null;
  reviewerNotes: string | null;
  createdAt: string | null;
  profileComplete: boolean;
}

export function VerificationPanel({ verification }: { verification: VerificationState }) {
  const [requestStatus, setRequestStatus] = useState(verification.requestStatus);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const verified = verification.level === "IDENTITY_VERIFIED" || requestStatus === "APPROVED";
  const completion = verified ? 100 : verification.profileComplete ? 75 : 40;
  const badge = requestStatus ? STATUS[requestStatus] : null;

  function submit() {
    startTransition(async () => {
      try {
        await submitVerificationAction();
        setRequestStatus("PENDING");
        toast.success("Solicitud enviada. La revisaremos en un máximo de 48 horas.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo enviar la solicitud.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div><h1 className="font-heading text-2xl font-semibold tracking-tight">Verificación de perfil</h1><p className="mt-1 text-sm text-muted-foreground">Un perfil verificado genera más confianza y mejores oportunidades de negocio.</p></div>
      <Card><CardHeader><CardTitle className="font-heading text-base">Progreso de tu perfil</CardTitle></CardHeader><CardContent className="space-y-2"><Progress value={completion} /><p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground tabular-nums">{completion}%</span> completado</p></CardContent></Card>
      <Card><CardHeader><CardTitle className="font-heading text-base">Solicitud de verificación</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"><span className="flex items-center gap-2 text-sm font-medium"><FileText className="size-4 text-muted-foreground" /> Verificación de identidad</span>{badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : <Badge variant="secondary">Sin solicitar</Badge>}</div>
        {verification.reviewerNotes && <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">{verification.reviewerNotes}</p>}
        <Button className="w-full gap-2" disabled={!verification.profileComplete || isPending || requestStatus === "PENDING" || verified} onClick={submit}><Send className="size-4" />{!verification.profileComplete ? "Completa tus perfiles operativos" : isPending ? "Enviando..." : requestStatus === "PENDING" ? "Solicitud en revisión" : verified ? "Perfil verificado" : "Enviar solicitud"}</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="font-heading text-base">Niveles de verificación</CardTitle></CardHeader><CardContent className="space-y-2">{LEVELS.map((level, index) => <div key={level.name} className="flex items-start gap-3 rounded-xl bg-muted/60 p-3"><BadgeCheck className={index === 0 || verified && index === 1 ? "size-5 text-primary" : "size-5 text-muted-foreground"} /><div><p className="text-sm font-medium">{level.name}</p><p className="text-xs text-muted-foreground">{level.detail}</p></div></div>)}</CardContent></Card>
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" asChild><Link href="/role-selection">Completar perfiles</Link></Button><Button asChild><Link href="/home">Ir al inicio</Link></Button></div>
    </div>
  );
}
