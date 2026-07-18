import { DesktopTopBar } from "@/components/layout/top-bar";
import { FreightCard } from "@/components/logistics/freight-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { listOpenShipments } from "@/lib/server/shipments";

export default async function FreightMarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, shipments] = await Promise.all([searchParams, listOpenShipments()]);
  const term = q?.trim().toLocaleLowerCase("es") ?? "";
  const filtered = term ? shipments.filter((item) =>
    [item.origin_label, item.destination_label, item.cargo_description].some((value) => value?.toLocaleLowerCase("es").includes(term)),
  ) : shipments;
  return (
    <div className="space-y-6">
      <DesktopTopBar title="Marketplace de cargas" description="Cargas publicadas buscando transporte." />
      <form className="max-w-md"><Input name="q" defaultValue={q} placeholder="Filtrar por origen, destino o carga…" /></form>
      {filtered.length === 0 ? <EmptyState icon={Truck} title="Sin cargas disponibles" description="No hay solicitudes activas con ese criterio." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((freight) => <FreightCard key={freight.id} freight={freight} />)}</div>
      )}
    </div>
  );
}
