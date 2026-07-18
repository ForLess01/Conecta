import { DesktopTopBar } from "@/components/layout/top-bar";
import { RiskEventForm } from "@/components/admin/risk-event-form";
import { requireAdminPage } from "@/lib/server/admin/auth";

export default async function CreateRiskEventPage() {
  await requireAdminPage();
  return <div className="mx-auto max-w-2xl space-y-6"><DesktopTopBar title="Crear evento de riesgo" description="Registra un evento territorial con fuente y nivel de confianza." /><RiskEventForm /></div>;
}
