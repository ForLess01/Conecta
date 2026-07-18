"use client";

import Link from "next/link";
import { ClipboardList, MessagesSquare, PackageSearch, TrendingUp, Truck } from "lucide-react";
import { useRole } from "@/components/layout/role-context";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSoles } from "@/lib/format";
import type { AccountDashboard } from "@/lib/server/account/account";

export function HomeDashboard({ actorName, dashboard }: { actorName: string; dashboard: AccountDashboard }) {
  const { activeRole } = useRole();
  if (activeRole === "productor") return <ProducerDashboard actorName={actorName} dashboard={dashboard} />;
  if (activeRole === "comprador") return <BuyerDashboard actorName={actorName} dashboard={dashboard} />;
  if (activeRole === "transportista") return <TransporterDashboard actorName={actorName} dashboard={dashboard} />;
  return null;
}

function ProducerDashboard({ actorName, dashboard }: { actorName: string; dashboard: AccountDashboard }) {
  const data = dashboard.producer;
  return (
    <div className="space-y-6">
      <DesktopTopBar title={`Hola, ${actorName}`} description="Este es el resumen de tu actividad como productor." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ventas potenciales" value={formatSoles(data.potentialSales)} icon={TrendingUp} hint="Según ofertas activas con referencia de precio" />
        <StatCard label="Ofertas recibidas" value={String(data.offersReceived)} icon={PackageSearch} hint="En los últimos 7 días" />
        <StatCard label="Negociaciones en curso" value={String(data.activeNegotiations)} icon={MessagesSquare} />
        <StatCard label="Pedidos por despachar" value={String(data.ordersToDispatch)} icon={ClipboardList} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">Productos activos</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/publish/offer">Publicar producto</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.products.length === 0 ? <EmptyState title="Sin productos activos" description="Publica un producto para verlo en este resumen." /> : data.products.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div><p className="text-sm font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{Number(product.quantity).toLocaleString("es-PE")} {product.unit} disponibles · {product.location}</p></div>
                <Button variant="outline" size="sm" asChild><Link href={`/marketplace/offers/${product.id}`}>Ver ofertas</Link></Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="font-heading text-base">Actividad de la cuenta</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Tus métricas se calculan con publicaciones, propuestas, negociaciones y órdenes reales.</p></CardContent></Card>
      </div>
      <Negotiations dashboard={dashboard} />
    </div>
  );
}

function BuyerDashboard({ actorName, dashboard }: { actorName: string; dashboard: AccountDashboard }) {
  const data = dashboard.buyer;
  return (
    <div className="space-y-6">
      <DesktopTopBar title={`Hola, ${actorName}`} description="Este es el resumen de tu actividad como comprador." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Requerimientos activos" value={String(data.activeRequests)} icon={ClipboardList} />
        <StatCard label="Propuestas recibidas" value={String(data.proposalsReceived)} icon={MessagesSquare} />
        <StatCard label="Órdenes en curso" value={String(data.activeOrders)} icon={PackageSearch} />
        <StatCard label="Gasto estimado del mes" value={formatSoles(data.monthlySpend)} icon={TrendingUp} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="font-heading text-base">Órdenes en curso</CardTitle><Button variant="ghost" size="sm" asChild><Link href="/orders">Ver órdenes</Link></Button></CardHeader><CardContent className="space-y-3">
          {data.orders.length === 0 ? <EmptyState title="Sin órdenes" description="Tus órdenes aparecerán aquí al aceptar una propuesta." /> : data.orders.map((order) => <div key={order.id} className="flex items-center justify-between rounded-xl border border-border p-3"><div><p className="text-sm font-medium">Orden {order.id.slice(0, 8).toUpperCase()}</p><p className="text-xs text-muted-foreground capitalize">{order.status.toLowerCase().replaceAll("_", " ")}</p></div><Button variant="outline" size="sm" asChild><Link href={`/orders/${order.id}`}>Ver detalle</Link></Button></div>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="font-heading text-base">Proveedores guardados</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold tabular-nums">{data.savedProviders}</p><p className="text-sm text-muted-foreground">Productores guardados desde el marketplace.</p></CardContent></Card>
      </div>
      <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="font-heading text-base">Requerimientos activos</CardTitle><Button variant="ghost" size="sm" asChild><Link href="/publish/request">Publicar requerimiento</Link></Button></CardHeader><CardContent className="space-y-3">
        {data.requests.length === 0 ? <EmptyState title="Sin requerimientos activos" description="Publica lo que necesitas comprar para recibir propuestas." /> : data.requests.map((request) => <div key={request.id} className="flex items-center justify-between rounded-xl border border-border p-3"><div><p className="text-sm font-medium">{request.name}</p><p className="text-xs text-muted-foreground">{Number(request.quantity).toLocaleString("es-PE")} {request.unit} solicitados</p></div><Button variant="outline" size="sm" asChild><Link href={`/marketplace/requests/${request.id}`}>Ver requerimiento</Link></Button></div>)}
      </CardContent></Card>
    </div>
  );
}

function TransporterDashboard({ actorName, dashboard }: { actorName: string; dashboard: AccountDashboard }) {
  const data = dashboard.transporter;
  return (
    <div className="space-y-6">
      <DesktopTopBar title={`Hola, ${actorName}`} description="Este es el resumen de tu actividad como transportista." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cargas disponibles" value={String(data.openLoads)} icon={Truck} />
        <StatCard label="Ofertas enviadas" value={String(data.sentBids)} icon={PackageSearch} />
        <StatCard label="Viajes programados" value={String(data.scheduledTrips)} icon={ClipboardList} />
        <StatCard label="Ingresos estimados" value={formatSoles(data.estimatedIncome)} icon={TrendingUp} hint="Este mes" />
      </div>
      <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="font-heading text-base">Cargas disponibles</CardTitle><Button variant="ghost" size="sm" asChild><Link href="/transport">Ver cargas</Link></Button></CardHeader><CardContent className="space-y-3">
        {data.loads.length === 0 ? <EmptyState title="Sin cargas disponibles" description="Las nuevas solicitudes de transporte aparecerán aquí." /> : data.loads.map((load) => <div key={load.id} className="flex items-center justify-between rounded-xl border border-border p-3"><div><p className="text-sm font-medium">{load.origin || "Origen por coordinar"} → {load.destination || "Destino por coordinar"}</p><p className="text-xs text-muted-foreground">{load.cargo || "Carga sin descripción"}{load.weightKg ? ` · ${Number(load.weightKg).toLocaleString("es-PE")} kg` : ""}</p></div><Button variant="outline" size="sm" asChild><Link href={`/transport/${load.id}`}>Ver detalle</Link></Button></div>)}
      </CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="font-heading text-base">Viajes programados</CardTitle><Button variant="ghost" size="sm" asChild><Link href="/trips">Mis viajes</Link></Button></CardHeader><CardContent className="space-y-3">
        {data.trips.length === 0 ? <EmptyState title="Sin viajes programados" description="Los viajes adjudicados aparecerán aquí." /> : data.trips.map((trip) => <div key={trip.id} className="flex items-center justify-between rounded-xl border border-border p-3"><div><p className="text-sm font-medium">{trip.cargo || "Transporte de carga"}</p><p className="text-xs text-muted-foreground capitalize">{trip.status.toLowerCase().replaceAll("_", " ")}</p></div><Button variant="outline" size="sm" asChild><Link href={`/trips/${trip.id}`}>Seguimiento</Link></Button></div>)}
      </CardContent></Card>
    </div>
  );
}

function Negotiations({ dashboard }: { dashboard: AccountDashboard }) {
  return <Card><CardHeader><CardTitle className="font-heading text-base">Negociaciones en curso</CardTitle></CardHeader><CardContent className="space-y-3">
    {dashboard.negotiations.length === 0 ? <EmptyState title="Sin negociaciones activas" description="Cuando recibas propuestas aparecerán aquí." /> : dashboard.negotiations.map((negotiation) => <div key={negotiation.id} className="flex items-center justify-between rounded-xl border border-border p-3"><div><p className="text-sm font-medium">{negotiation.preview}</p>{negotiation.expiresAt && <p className="text-xs text-muted-foreground">Ventana vence {new Date(negotiation.expiresAt).toLocaleString("es-PE")}</p>}</div><Button variant="outline" size="sm" asChild><Link href={`/negotiations/${negotiation.id}`}>Abrir negociación</Link></Button></div>)}
  </CardContent></Card>;
}
