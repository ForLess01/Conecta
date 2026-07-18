"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, MessagesSquare } from "lucide-react";
import { getRequestById } from "@/lib/mock/requests";
import { BUYERS } from "@/lib/mock/actors";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VerificationBadge } from "@/components/marketplace/misc-badges";
import { MapPlaceholder } from "@/components/maps/map-placeholder";
import { CreateProposalDialog } from "@/components/negotiation/create-proposal-dialog";
import { formatSoles, formatDate, formatQuantity } from "@/lib/format";

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const request = getRequestById(id);
  const router = useRouter();
  const [proposalOpen, setProposalOpen] = useState(false);

  if (!request) notFound();

  const buyer = BUYERS.find((b) => b.id === request.buyerId);
  const coveragePercent = Math.round((request.coveredQuantity / request.volume) * 100);

  return (
    <div className="space-y-6">
      <DesktopTopBar title={request.productName} description={`Requerimiento de ${buyer?.organization ?? buyer?.name}`} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                {request.acceptsPartial && <Badge variant="secondary">Acepta oferta parcial</Badge>}
                {request.acceptsMultipleProducers && <Badge variant="secondary">Acepta múltiples productores</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Info label="Volumen total" value={formatQuantity(request.volume, request.unit)} />
                <Info label="Calidad exigida" value={request.quality} />
                <Info label="Plazo de entrega" value={formatDate(request.deadline)} />
                <Info
                  label="Precio inicial referencial"
                  value={request.initialPrice ? `${formatSoles(request.initialPrice)} / ${request.unit}` : "A convenir"}
                />
                <Info label="Logística preferida" value={request.logisticsPreference} />
                <Info label="Propuestas recibidas" value={String(request.proposalsCount)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <h3 className="font-heading text-base font-semibold">Cobertura del requerimiento</h3>
              <Progress value={coveragePercent} />
              <p className="text-sm text-muted-foreground">
                {formatQuantity(request.coveredQuantity, request.unit)} cubiertos de {formatQuantity(request.volume, request.unit)} (
                <span className="tabular-nums">{coveragePercent}%</span>)
              </p>
            </CardContent>
          </Card>

          <MapPlaceholder
            label="Destino de entrega"
            markers={[{ label: `${request.destination.district}, ${request.destination.region}` }]}
          />
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <p className="text-xs font-medium text-muted-foreground">Comprador</p>
              <div>
                <p className="text-sm font-medium">{buyer?.name}</p>
                <p className="text-xs text-muted-foreground">{buyer?.organization}</p>
                {buyer && <VerificationBadge level={buyer.verification} />}
              </div>
              <p className="text-xs text-muted-foreground">Frecuencia de compra: {buyer?.purchaseFrequency}</p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={`/profiles/${buyer?.id}`}>Ver perfil del comprador</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 pt-6">
              <Button size="lg" className="w-full" onClick={() => setProposalOpen(true)}>
                Postular con propuesta
              </Button>
              <Button size="lg" variant="outline" className="w-full gap-2" asChild>
                <Link href="/negotiations">
                  <MessagesSquare className="size-4" /> Conversar
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="w-full gap-2" onClick={() => toast.success("Requerimiento guardado.")}>
                <Bookmark className="size-4" /> Guardar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateProposalDialog
        open={proposalOpen}
        onOpenChange={setProposalOpen}
        defaults={{
          quantity: Math.min(2000, request.volume - request.coveredQuantity),
          unit: request.unit,
          pricePerUnit: request.initialPrice ?? 0,
          deliveryDate: request.deadline,
          qualityTerms: request.quality,
          logisticsMode: request.logisticsPreference,
        }}
        onSubmit={() => {
          toast.success("Propuesta enviada al comprador.");
          router.push("/negotiations");
        }}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
