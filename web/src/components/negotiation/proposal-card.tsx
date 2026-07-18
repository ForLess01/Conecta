"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Proposal } from "@/types/domain";
import { formatSoles, formatDate, formatDateTime } from "@/lib/format";

export function ProposalCard({
  proposal,
  onAccept,
  onCounter,
  onReject,
}: {
  proposal: Proposal;
  onAccept?: () => void;
  onCounter?: () => void;
  onReject?: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-secondary/50 p-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold">Propuesta estructurada</p>
        <Badge variant={proposal.status === "activa" ? "default" : "secondary"} className="capitalize">
          {proposal.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Field label="Cantidad" value={`${proposal.quantity.toLocaleString("es-PE")} ${proposal.unit}`} />
        <Field label="Precio por unidad" value={formatSoles(proposal.pricePerUnit)} />
        <Field label="Fecha de entrega" value={formatDate(proposal.deliveryDate)} />
        <Field label="Logística" value={proposal.logisticsMode} />
        <Field label="Calidad" value={proposal.qualityTerms} className="col-span-2" />
        <Field label="Vigente hasta" value={formatDateTime(proposal.validUntil)} className="col-span-2" />
      </div>

      {proposal.notes && <p className="text-xs text-muted-foreground">{proposal.notes}</p>}

      {proposal.status === "activa" && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" onClick={onAccept}>Aceptar</Button>
          <Button size="sm" variant="outline" onClick={onCounter}>Contraofertar</Button>
          <Button size="sm" variant="ghost" onClick={onReject}>Rechazar</Button>
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
