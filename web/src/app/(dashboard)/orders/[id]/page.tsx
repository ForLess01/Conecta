"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/mock/orders";
import { getProductById } from "@/lib/mock/products";
import { PRODUCERS, BUYERS } from "@/lib/mock/actors";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { EmptyState } from "@/components/shared/empty-state";
import { formatSoles } from "@/lib/format";
import { FileWarning, Image as ImageIcon } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  pendiente_logistica: "Pendiente de logística",
  logistica_seleccionada: "Logística seleccionada",
  en_despacho: "En despacho",
  en_transito: "En tránsito",
  entregado: "Entregado",
  completado: "Completado",
  con_incidencia: "Con incidencia",
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = getOrderById(id);
  if (!order) notFound();

  const product = getProductById(order.productId);
  const buyer = BUYERS.find((b) => b.id === order.buyerId);

  return (
    <div className="space-y-6">
      <DesktopTopBar title={`Orden ${order.id.toUpperCase()}`} description={STATUS_LABEL[order.status]} />

      <Tabs defaultValue="resumen">
        <TabsList className="flex-wrap">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="productores">Productores</TabsTrigger>
          <TabsTrigger value="logistica">Logística</TabsTrigger>
          <TabsTrigger value="evidencias">Evidencias</TabsTrigger>
          <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Comprador</p>
                <p className="text-sm font-medium">{buyer?.name} · {buyer?.organization}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Producto</p>
                <p className="text-sm font-medium">{product?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total comercial</p>
                <p className="font-heading text-lg font-semibold tabular-nums">{formatSoles(order.total)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado actual</p>
                <p className="text-sm font-medium">{STATUS_LABEL[order.status]}</p>
              </div>
            </CardContent>
          </Card>
          {order.status === "pendiente_logistica" && (
            <Button asChild>
              <Link href={`/orders/${order.id}/logistics`}>Seleccionar logística</Link>
            </Button>
          )}
        </TabsContent>

        <TabsContent value="productores" className="space-y-3">
          {order.allocations.map((alloc) => {
            const producer = PRODUCERS.find((p) => p.id === alloc.producerId);
            return (
              <Card key={alloc.producerId}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div>
                    <p className="text-sm font-medium">{producer?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {alloc.quantity.toLocaleString("es-PE")} {product?.unit} · {formatSoles(alloc.pricePerUnit)}/{product?.unit}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{alloc.distanceKm} km</span>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="logistica">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              {order.logisticsMode
                ? `Modalidad seleccionada: ${order.logisticsMode.replaceAll("_", " ")}`
                : "Aún no se ha seleccionado la modalidad logística."}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidencias">
          <EmptyState icon={ImageIcon} title="Sin evidencias todavía" description="Las fotos de despacho y recepción aparecerán aquí." />
        </TabsContent>

        <TabsContent value="incidencias">
          <EmptyState icon={FileWarning} title="Sin incidencias reportadas" description="Buen viaje. No hay reportes en esta orden." />
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardContent className="pt-6">
              <OrderTimeline steps={order.timeline} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
