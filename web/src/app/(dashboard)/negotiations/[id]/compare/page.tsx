"use client";

import { use } from "react";
import { useRouter, notFound } from "next/navigation";
import { toast } from "sonner";
import { getNegotiationById } from "@/lib/mock/negotiations";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatSoles, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CompareProposalsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const negotiation = getNegotiationById(id);
  const router = useRouter();

  if (!negotiation || negotiation.proposals.length === 0) notFound();

  const original = negotiation.proposals[0];
  const counter = {
    ...original,
    id: "counter-preview",
    quantity: Math.round(original.quantity * 0.9),
    pricePerUnit: Number((original.pricePerUnit * 1.05).toFixed(2)),
    deliveryDate: original.deliveryDate,
  };

  const rows: { label: string; a: string; b: string; diff: boolean }[] = [
    { label: "Precio por unidad", a: formatSoles(original.pricePerUnit), b: formatSoles(counter.pricePerUnit), diff: true },
    { label: "Cantidad", a: `${original.quantity.toLocaleString("es-PE")} ${original.unit}`, b: `${counter.quantity.toLocaleString("es-PE")} ${counter.unit}`, diff: true },
    { label: "Fecha de entrega", a: formatDate(original.deliveryDate), b: formatDate(counter.deliveryDate), diff: false },
    { label: "Entrega / logística", a: original.logisticsMode, b: counter.logisticsMode, diff: false },
    { label: "Calidad", a: original.qualityTerms, b: counter.qualityTerms, diff: false },
  ];

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Comparar propuesta y contraoferta" description={`Vigente hasta ${formatDateTime(original.validUntil)}`} />

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-2">Campo</th>
                <th className="pb-2">Propuesta original</th>
                <th className="pb-2">Contraoferta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="py-3 text-xs text-muted-foreground">{row.label}</td>
                  <td className={cn("py-3 font-medium", row.diff && "text-[color:var(--info)]")}>{row.a}</td>
                  <td className={cn("py-3 font-medium", row.diff && "text-[color:var(--amber)]")}>{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => router.push(`/negotiations/${negotiation.id}`)}>
          Volver al chat
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            toast.info("Contraoferta enviada.");
            router.push(`/negotiations/${negotiation.id}`);
          }}
        >
          Contraofertar
        </Button>
        <Button
          onClick={() => {
            toast.success("Acuerdo confirmado.");
            router.push(`/negotiations/${negotiation.id}/match`);
          }}
        >
          Aceptar esta
        </Button>
      </div>
    </div>
  );
}
