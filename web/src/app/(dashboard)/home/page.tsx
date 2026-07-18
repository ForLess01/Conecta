import { getAccountDashboard } from "@/lib/server/account/account";
import { HomeDashboard } from "./home-dashboard";

export default async function HomePage() {
  const { actor, dashboard } = await getAccountDashboard();
  return <HomeDashboard actorName={actor.name} dashboard={dashboard} />;
}
