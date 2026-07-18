"use client";

import { use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBidsForFreight, getFreightById } from "@/lib/mock/logistics";
import { TRANSPORTERS, VEHICLES } from "@/lib/mock/actors";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/marketplace/risk-badge";
import { formatSoles, formatDateTime } from "@/lib/format";
import { VEHICLE_LABELS } from "@/lib/mock/vehicle-labels";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

export default function CompareFreightBidsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const freight = getFreightById(id);
  const router = useRouter();

  if (!freight) notFound();

  const bids = getBidsForFreight(freight.id);

  function selectBid(transporterName: string) {
    toast.success(`Transportista ${transporterName} seleccionado.`);
    router.push("/trips/trip-1");
  }

  return (
    <div className="space-y-6">
      <DesktopTopBar
        title="Comparar ofertas de flete"
        description={`${freight.origin.district} → ${freight.destination.district} · ${bids.length} ofertas recibidas`}
      />

      {bids.length === 0 ? (
        <EmptyState icon={Users} title="Sin ofertas de transportistas todavía" description="Vuelve pronto: las ofertas aparecerán aquí." />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transportista</TableHead>
                  <TableHead>Tarifa</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead>Riesgo adaptado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid) => {
                  const transporter = TRANSPORTERS.find((t) => t.id === bid.transporterId);
                  const vehicle = VEHICLES.find((v) => v.id === bid.vehicleId);
                  return (
                    <TableRow key={bid.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transporter?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {transporter?.isCompany ? "Empresa" : "Independiente"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">{formatSoles(bid.rate)}</TableCell>
                      <TableCell>{vehicle ? VEHICLE_LABELS[vehicle.type] : "—"}</TableCell>
                      <TableCell className="text-xs">{formatDateTime(bid.departureAt)}</TableCell>
                      <TableCell className="tabular-nums">{bid.estimatedDurationHours} h</TableCell>
                      <TableCell className="space-x-1">
                        {bid.helperIncluded && <Badge variant="secondary">Ayudante</Badge>}
                        {bid.insuranceIncluded && <Badge variant="secondary">Seguro</Badge>}
                      </TableCell>
                      <TableCell>
                        <RiskBadge level={freight.risk.level} score={freight.risk.score} showScore={false} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => selectBid(transporter?.name ?? "")}>
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {bids.map((bid) => {
              const transporter = TRANSPORTERS.find((t) => t.id === bid.transporterId);
              const vehicle = VEHICLES.find((v) => v.id === bid.vehicleId);
              return (
                <div key={bid.id} className="space-y-2 rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{transporter?.name}</p>
                    <span className="font-heading font-semibold tabular-nums">{formatSoles(bid.rate)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {vehicle ? VEHICLE_LABELS[vehicle.type] : "—"} · {bid.estimatedDurationHours} h · Sale {formatDateTime(bid.departureAt)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {bid.helperIncluded && <Badge variant="secondary">Ayudante</Badge>}
                    {bid.insuranceIncluded && <Badge variant="secondary">Seguro</Badge>}
                    <RiskBadge level={freight.risk.level} score={freight.risk.score} showScore={false} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/profiles/${transporter?.id}`}>Ver perfil</Link>
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => selectBid(transporter?.name ?? "")}>
                      Seleccionar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
