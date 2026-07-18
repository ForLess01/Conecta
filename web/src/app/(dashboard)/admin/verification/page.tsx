"use client";

import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRODUCERS, TRANSPORTERS } from "@/lib/mock/actors";

export default function AdminVerificationPage() {
  const pending = [...PRODUCERS.filter((p) => p.verification === "basico"), ...TRANSPORTERS.filter((t) => t.verification === "basico")];

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Verificación de usuarios" description="Cola de solicitudes pendientes de revisión." />
      <div className="space-y-3">
        {pending.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <Badge variant="secondary">Documentos presentados</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => toast.success(`${user.name} aprobado (demo).`)}>Aprobar</Button>
                <Button size="sm" variant="outline" onClick={() => toast.error(`${user.name} rechazado (demo).`)}>Rechazar</Button>
                <Button size="sm" variant="ghost" onClick={() => toast.info("Se solicitaron más datos (demo).")}>Pedir más datos</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
