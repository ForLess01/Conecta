"use client";

import { DesktopTopBar } from "@/components/layout/top-bar";
import { FreightCard } from "@/components/logistics/freight-card";
import { FREIGHT_REQUESTS } from "@/lib/mock/logistics";
import { EmptyState } from "@/components/shared/empty-state";
import { Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function FreightMarketplacePage() {
  return (
    <div className="space-y-6">
      <DesktopTopBar title="Marketplace de cargas" description="Cargas publicadas por compradores y productores buscando transporte." />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Filtrar por origen, destino o vehículo…" className="pl-9" />
      </div>

      {FREIGHT_REQUESTS.length === 0 ? (
        <EmptyState icon={Truck} title="Sin cargas disponibles" description="No hay solicitudes de transporte activas por ahora." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FREIGHT_REQUESTS.map((freight) => (
            <FreightCard key={freight.id} freight={freight} />
          ))}
        </div>
      )}
    </div>
  );
}
