"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CommerceProposal } from "@/lib/server/commerce/types";
import { formatSoles, formatDate, formatDateTime } from "@/lib/format";

export function ProposalCard({
  proposal,
  onAccept,
  onCounter,
  onReject,
  canRespond = true,
  pending = false,
}: {
  proposal: CommerceProposal;
  onAccept?: () => void;
  onCounter?: () => void;
  onReject?: () => void;
  canRespond?: boolean;
  pending?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-secondary/50 p-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold">Propuesta estructurada</p>
        <Badge variant={proposal.status === "ACTIVE" ? "default" : "secondary"} className="capitalize">
          {proposal.status.toLocaleLowerCase("es")}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Field label="Cantidad" value={`${proposal.quantity.toLocaleString("es-PE")} ${proposal.unit}`} />
        <Field label="Precio por unidad" value={formatSoles(proposal.unitPrice)} />
        <Field label="Fecha de entrega" value={proposal.deliveryDate ? formatDate(proposal.deliveryDate) : "Por acordar"} />
        <Field label="Logística" value={proposal.logisticsMode?.replaceAll("_", " ") ?? "Por acordar"} />
        <Field label="Vigente hasta" value={proposal.expiresAt ? formatDateTime(proposal.expiresAt) : "Sin vencimiento"} className="col-span-2" />
      </div>

      {proposal.status === "ACTIVE" && canRespond && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" onClick={onAccept} disabled={pending}>Aceptar</Button>
          <Button size="sm" variant="outline" onClick={onCounter} disabled={pending}>Contraofertar</Button>
          <Button size="sm" variant="ghost" onClick={onReject} disabled={pending}>Rechazar</Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
