import { getAccountDashboard } from "@/lib/server/account/account";
import { HomeDashboard } from "./home-dashboard";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { actor, dashboard } = await getAccountDashboard();
  if (actor.activeRole === "admin") redirect("/admin");
  return <HomeDashboard actorName={actor.name} dashboard={dashboard} />;
}
