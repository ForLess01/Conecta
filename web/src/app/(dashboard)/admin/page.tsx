import Link from "next/link";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminMetrics } from "@/lib/server/admin/data";
import { Users, ClipboardList, MessagesSquare, Truck, ShieldAlert, TrendingUp, FileWarning } from "lucide-react";

export default async function AdminDashboardPage() {
  const metrics = await getAdminMetrics();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DesktopTopBar title="Panel de administración" description="Resumen operativo de la plataforma." />
        <Button asChild><Link href="/admin/risk-events">Actualizar riesgos con IA</Link></Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuarios totales" value={String(metrics.totalUsers)} icon={Users} hint="Cuentas registradas en Supabase" />
        <StatCard label="Publicaciones activas" value={String(metrics.activeListings)} icon={ClipboardList} />
        <StatCard label="Negociaciones en curso" value={String(metrics.negotiationsInProgress)} icon={MessagesSquare} />
        <StatCard label="Envíos activos" value={String(metrics.activeShipments)} icon={Truck} />
        <StatCard label="Eventos de riesgo vigentes" value={String(metrics.activeRiskEvents)} icon={ShieldAlert} />
        <StatCard label="Cobertura de precios" value={`${metrics.priceCoveragePercent}%`} icon={TrendingUp} />
        <StatCard label="Reportes abiertos" value={String(metrics.openIncidents)} icon={FileWarning} />
        <StatCard label="Órdenes completadas" value={String(metrics.completedOrders)} icon={ClipboardList} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/risk-events", label: "Gestión de eventos de riesgo" },
          { href: "/admin/prices", label: "Observaciones de precios" },
          { href: "/admin/verification", label: "Verificación de usuarios" },
          { href: "/admin/moderation", label: "Moderación" },
          { href: "/admin/analytics", label: "Analítica" },
          { href: "/orders", label: "Órdenes" },
        ].map((item) => (
          <Card key={item.href}>
            <CardContent className="flex items-center justify-between pt-6">
              <span className="text-sm font-medium">{item.label}</span>
              <Button variant="outline" size="sm" asChild>
                <Link href={item.href}>Ir</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
