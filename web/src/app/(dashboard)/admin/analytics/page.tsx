import Link from "next/link";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Clock, TrendingUp, Truck, ShieldAlert, ClipboardCheck } from "lucide-react";
import { getOperationsAnalytics } from "@/lib/server/analytics/operations";

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const requested = Number((await searchParams).days);
  const days = [7, 30, 90].includes(requested) ? requested : 30;
  const analytics = await getOperationsAnalytics(days);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><DesktopTopBar title="Analítica" description={`Indicadores operativos de los últimos ${days} días.`} /><div className="flex flex-wrap gap-2">{[7, 30, 90].map((range) => <Button key={range} variant={range === days ? "default" : "outline"} size="sm" asChild><Link href={`/admin/analytics?days=${range}`}>{range} días</Link></Button>)}<Button asChild><a href={`/api/admin/analytics?days=${days}&format=csv`}>Exportar CSV</a></Button></div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Negociaciones por día" value={String(analytics.negotiationsPerDay)} icon={BarChart3} />
        <StatCard label="Tiempo medio de negociación" value={analytics.averageNegotiationHours === null ? "Sin datos" : `${analytics.averageNegotiationHours} h`} icon={Clock} />
        <StatCard label="Observaciones de precios" value={String(analytics.priceObservations)} icon={TrendingUp} />
        <StatCard label="Uso de transporte marketplace" value={`${analytics.marketplaceTransportPercent}%`} icon={Truck} />
        <StatCard label="Severidad media de riesgos" value={analytics.averageRiskSeverity === null ? "Sin datos" : `${analytics.averageRiskSeverity.toFixed(1)}/5`} icon={ShieldAlert} />
        <StatCard label="Órdenes completadas" value={String(analytics.completedOrders)} icon={ClipboardCheck} />
      </div>
      <Card><CardContent className="pt-6"><h2 className="font-heading font-semibold">Productos con mayor volumen acordado</h2><div className="mt-4 space-y-2">{analytics.topProducts.map((product, index) => <div key={product.name} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm"><span>{index + 1}. {product.name}</span><span className="tabular-nums">{product.quantity.toLocaleString("es-PE")}</span></div>)}{analytics.topProducts.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay órdenes en el rango.</p> : null}</div></CardContent></Card>
    </div>
  );
}
