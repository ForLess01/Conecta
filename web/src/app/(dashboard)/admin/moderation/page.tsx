import { DesktopTopBar } from "@/components/layout/top-bar";
import { ModerationQueue } from "@/components/admin/moderation-queue";
import { listModerationReports } from "@/lib/server/admin/data";

export default async function AdminModerationPage() {
  const reports = await listModerationReports();
  return <div className="space-y-6"><DesktopTopBar title="Moderación" description="Reportes persistentes de publicaciones enviados por la comunidad." /><ModerationQueue reports={reports} /></div>;
}
