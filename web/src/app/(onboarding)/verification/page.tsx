"use client";

import Link from "next/link";
import { toast } from "sonner";
import { BadgeCheck, FileText, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const DOCUMENTS = [
  { name: "DNI", status: "aprobado" },
  { name: "Constancia de posesión", status: "en_revision" },
  { name: "Registro sanitario", status: "pendiente" },
];

const LEVELS = [
  { name: "Básico", detail: "Identidad declarada. Puedes explorar y conversar." },
  { name: "Verificado", detail: "Documentos validados. Puedes publicar y cerrar operaciones." },
  { name: "Confiable", detail: "Historial de operaciones completadas sin incidencias." },
];

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  aprobado: { label: "Aprobado", variant: "default" },
  en_revision: { label: "En revisión", variant: "secondary" },
  pendiente: { label: "Pendiente", variant: "secondary" },
};

export default function ProfileVerificationPage() {
  const completion = 55;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Verificación de perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Un perfil verificado genera más confianza y mejores oportunidades de negocio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Progreso de tu perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={completion} />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{completion}%</span> completado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {DOCUMENTS.map((doc) => {
            const badge = STATUS_BADGE[doc.status];
            return (
              <div key={doc.name} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="size-4 text-muted-foreground" /> {doc.name}
                </span>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
            );
          })}
          <Button
            variant="outline"
            className="mt-2 w-full gap-2"
            onClick={() => toast.success("Documento recibido. Lo revisaremos en un máximo de 48 horas.")}
          >
            <Upload className="size-4" /> Subir documento
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Niveles de verificación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {LEVELS.map((level, index) => (
            <div key={level.name} className="flex items-start gap-3 rounded-xl bg-muted/60 p-3">
              <BadgeCheck className={index === 0 ? "size-5 text-primary" : "size-5 text-muted-foreground"} />
              <div>
                <p className="text-sm font-medium">{level.name}</p>
                <p className="text-xs text-muted-foreground">{level.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/settings">Completar perfil</Link>
        </Button>
        <Button asChild>
          <Link href="/home">Ir al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
