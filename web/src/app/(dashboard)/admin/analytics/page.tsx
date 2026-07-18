"use client";

import { DesktopTopBar } from "@/components/layout/top-bar";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Clock, TrendingUp, Truck, ShieldAlert, MapPin } from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DesktopTopBar title="Analítica" description="Indicadores de desempeño de la plataforma." />
        <div className="flex gap-2">
          <Button variant="outline">Filtrar rango</Button>
          <Button>Exportar</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Matches por día" value="18" icon={BarChart3} />
        <StatCard label="Tiempo medio de negociación" value="6.4 h" icon={Clock} />
        <StatCard label="Precios acordados vs sugeridos" value="+3.2%" icon={TrendingUp} />
        <StatCard label="Uso de transporte marketplace" value="61%" icon={Truck} />
        <StatCard label="Riesgo promedio por corredor" value="42/100" icon={ShieldAlert} />
        <StatCard label="Retorno vacío" value="24%" icon={MapPin} />
      </div>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Los gráficos detallados de productos top y regiones activas se integrarán con datos reales en la siguiente fase.
        </CardContent>
      </Card>
    </div>
  );
}
