"use client";

import Link from "next/link";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { ORDERS } from "@/lib/mock/orders";
import { getProductById } from "@/lib/mock/products";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatSoles } from "@/lib/format";
import { ClipboardList } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  pendiente_logistica: "Pendiente de logística",
  logistica_seleccionada: "Logística seleccionada",
  en_despacho: "En despacho",
  en_transito: "En tránsito",
  entregado: "Entregado",
  completado: "Completado",
  con_incidencia: "Con incidencia",
};

export default function OrdersListPage() {
  return (
    <div className="space-y-6">
      <DesktopTopBar title="Órdenes" description="Órdenes comerciales generadas a partir de negociaciones confirmadas." />

      {ORDERS.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin órdenes" description="Cuando confirmes un match aparecerá aquí." />
      ) : (
        <div className="space-y-3">
          {ORDERS.map((order) => {
            const product = getProductById(order.productId);
            return (
              <Card key={order.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div>
                    <p className="font-heading font-semibold">Orden {order.id.toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">{product?.name}</p>
                    <p className="text-xs text-muted-foreground">{STATUS_LABEL[order.status]}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-heading font-semibold tabular-nums">{formatSoles(order.total)}</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>Ver detalle</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
