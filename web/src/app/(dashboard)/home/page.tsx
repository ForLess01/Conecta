"use client";

import Link from "next/link";
import { useRole } from "@/components/layout/role-context";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { StatCard } from "@/components/shared/stat-card";
import { RiskBadge } from "@/components/marketplace/risk-badge";
import { ConfidenceBadge, FreshnessBadge } from "@/components/marketplace/confidence-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PRODUCTS } from "@/lib/mock/products";
import { PURCHASE_REQUESTS } from "@/lib/mock/requests";
import { NEGOTIATIONS } from "@/lib/mock/negotiations";
import { ORDERS } from "@/lib/mock/orders";
import { FREIGHT_REQUESTS } from "@/lib/mock/logistics";
import { TRIPS } from "@/lib/mock/logistics";
import { formatSoles } from "@/lib/format";
import { ClipboardList, MessagesSquare, PackageSearch, TrendingUp, Truck } from "lucide-react";

export default function HomePage() {
  const { activeRole } = useRole();

  if (activeRole === "productor") return <ProducerDashboard />;
  if (activeRole === "comprador") return <BuyerDashboard />;
  if (activeRole === "transportista") return <TransporterDashboard />;

  return (
    <div className="space-y-4">
      <DesktopTopBar title="Panel de administración" description="El resumen ejecutivo vive en Administración." />
      <Button asChild>
        <Link href="/admin">Ir al dashboard administrativo</Link>
      </Button>
    </div>
  );
}

function ProducerDashboard() {
  const myProducts = PRODUCTS.filter((p) => p.producerId === "prod-1");
  const myNegotiations = NEGOTIATIONS.filter((n) => n.producerId === "prod-1");

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Hola, Efraín" description="Este es el resumen de tu actividad como productor." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ventas potenciales" value={formatSoles(12840)} icon={TrendingUp} hint="Según ofertas activas" />
        <StatCard label="Ofertas recibidas" value="7" icon={PackageSearch} hint="En los últimos 7 días" />
        <StatCard label="Negociaciones en curso" value={String(myNegotiations.length)} icon={MessagesSquare} />
        <StatCard label="Pedidos por despachar" value="1" icon={ClipboardList} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">Productos activos</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/publish/offer">Publicar producto</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {myProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.quantityAvailable.toLocaleString("es-PE")} {product.unit} disponibles
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/marketplace/offers/${product.id}`}>Ver ofertas</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Alertas de acceso a tu zona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myProducts.slice(0, 2).map((product) => (
              <div key={product.id} className="space-y-1.5 rounded-xl border border-border p-3">
                <p className="text-xs font-medium">{product.location.district}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <RiskBadge level={product.risk.level} score={product.risk.score} />
                  <ConfidenceBadge confidence={product.risk.confidence} />
                </div>
                <FreshnessBadge updatedAt={product.risk.updatedAt} />
              </div>
            ))}
            <Button variant="ghost" size="sm" asChild className="w-full">
              <Link href={`/risk/${myProducts[0]?.id}`}>Ver alertas completas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Negociaciones en curso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {myNegotiations.length === 0 ? (
            <EmptyState title="Sin negociaciones activas" description="Cuando recibas propuestas aparecerán aquí." />
          ) : (
            myNegotiations.map((neg) => (
              <div key={neg.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{neg.lastMessagePreview}</p>
                  <p className="text-xs text-muted-foreground">Ventana vence {new Date(neg.windowExpiresAt).toLocaleString("es-PE")}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/negotiations/${neg.id}`}>Abrir negociación</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BuyerDashboard() {
  const myRequests = PURCHASE_REQUESTS.filter((r) => r.buyerId === "buyer-2");
  const myOrders = ORDERS.filter((o) => o.buyerId === "buyer-2");

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Hola, Juan Pablo" description="Este es el resumen de tu actividad como comprador." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Requerimientos activos" value={String(myRequests.length)} icon={ClipboardList} />
        <StatCard label="Propuestas recibidas" value="4" icon={MessagesSquare} />
        <StatCard label="Órdenes en curso" value={String(myOrders.length)} icon={PackageSearch} />
        <StatCard label="Gasto estimado del mes" value={formatSoles(9840)} icon={TrendingUp} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">Órdenes en curso</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders">Ver órdenes</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {myOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Orden {order.id.toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground capitalize">{order.status.replaceAll("_", " ")}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/orders/${order.id}`}>Ver detalle</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Proveedores guardados</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState title="Sin proveedores guardados" description="Guarda productores desde el marketplace para verlos aquí." />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-base">Requerimientos activos</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/publish/request">Publicar requerimiento</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {myRequests.map((req) => (
            <div key={req.id} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">{req.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {req.coveredQuantity.toLocaleString("es-PE")} / {req.volume.toLocaleString("es-PE")} {req.unit} cubiertos
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/marketplace">Explorar marketplace</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TransporterDashboard() {
  const nearbyFreight = FREIGHT_REQUESTS.filter((f) => f.status === "publicado" || f.status === "con_ofertas");
  const myTrips = TRIPS;

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Hola, Wilfredo" description="Este es el resumen de tu actividad como transportista." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cargas cercanas" value={String(nearbyFreight.length)} icon={Truck} />
        <StatCard label="Ofertas enviadas" value="2" icon={PackageSearch} />
        <StatCard label="Viajes programados" value={String(myTrips.length)} icon={ClipboardList} />
        <StatCard label="Ingresos estimados" value={formatSoles(3200)} icon={TrendingUp} hint="Este mes" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">Cargas cercanas a tu ubicación</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transport">Ver cargas</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {nearbyFreight.map((freight) => (
              <div key={freight.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {freight.origin.district} → {freight.destination.district}
                  </p>
                  <p className="text-xs text-muted-foreground">{freight.distanceKm} km · {freight.cargoDescription}</p>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge level={freight.risk.level} score={freight.risk.score} showScore={false} />
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/transport/${freight.id}`}>Ver detalle</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Retorno disponible sugerido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Hay carga de retorno disponible en Puno hacia Ilave tras tu próxima entrega.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Activar retorno
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-base">Viajes programados</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/trips">Mis viajes</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {myTrips.map((trip) => (
            <div key={trip.id} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">{trip.cargoDescription}</p>
                <p className="text-xs text-muted-foreground capitalize">{trip.status.replaceAll("_", " ")}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/trips/${trip.id}`}>Seguimiento</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
