"use client";

import Link from "next/link";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ADMIN_KPIS } from "@/lib/mock/admin";
import { Users, ClipboardList, MessagesSquare, Truck, ShieldAlert, TrendingUp, FileWarning, RefreshCcw } from "lucide-react";

export default function AdminDashboardPage() {
  const totalUsers = Object.values(ADMIN_KPIS.usersByRole).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DesktopTopBar title="Panel de administración" description="Resumen operativo de la plataforma." />
        <Button className="gap-2" onClick={() => toast.success("Riesgos actualizados con IA (simulado).")}>
          <RefreshCcw className="size-4" /> Actualizar riesgos con IA
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuarios totales" value={String(totalUsers)} icon={Users} hint="Productor / comprador / transportista" />
        <StatCard label="Publicaciones activas" value={String(ADMIN_KPIS.activeListings)} icon={ClipboardList} />
        <StatCard label="Negociaciones en curso" value={String(ADMIN_KPIS.negotiationsInProgress)} icon={MessagesSquare} />
        <StatCard label="Envíos activos" value={String(ADMIN_KPIS.activeShipments)} icon={Truck} />
        <StatCard label="Eventos de riesgo vigentes" value={String(ADMIN_KPIS.activeRiskEvents)} icon={ShieldAlert} />
        <StatCard label="Cobertura de precios" value={`${ADMIN_KPIS.priceCoveragePercent}%`} icon={TrendingUp} />
        <StatCard label="Incidencias abiertas" value={String(ADMIN_KPIS.openIncidents)} icon={FileWarning} />
        <StatCard label="Órdenes completadas" value={String(ADMIN_KPIS.ordersByStatus.completado)} icon={ClipboardList} />
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
