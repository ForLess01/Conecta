import { DesktopTopBar } from "@/components/layout/top-bar";
import { PriceObservationsManager } from "@/components/admin/price-observations-manager";
import { getPriceCatalogs, listPriceObservations } from "@/lib/server/pricing/observations";

export default async function AdminPricesPage() {
  const [observations, catalogs] = await Promise.all([listPriceObservations(), getPriceCatalogs()]);
  return (
    <div className="space-y-6">
      <DesktopTopBar title="Observaciones de precios" description="Precios de referencia persistidos que alimentan el motor de sugerencia." />
      <PriceObservationsManager observations={observations} catalogs={catalogs} />
    </div>
  );
}
