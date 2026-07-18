import { DesktopTopBar } from "@/components/layout/top-bar";
import { VerificationQueue } from "@/components/admin/verification-queue";
import { listVerificationRequests } from "@/lib/server/admin/data";

export default async function AdminVerificationPage() {
  const requests = await listVerificationRequests();
  return <div className="space-y-6"><DesktopTopBar title="Verificación de usuarios" description="Cola persistente de solicitudes pendientes de revisión." /><VerificationQueue requests={requests} /></div>;
}
