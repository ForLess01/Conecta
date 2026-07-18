import { RoleProvider } from "@/components/layout/role-context";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import { redirect } from "next/navigation";
import { getMyActorContext } from "@/lib/supabase/session";
import { getUnreadNotificationCount } from "@/lib/server/notifications/queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [actor, unreadNotificationCount] = await Promise.all([
    getMyActorContext(),
    getUnreadNotificationCount(),
  ]);
  if (!actor || actor.roles.length === 0) redirect("/role-selection");

  return (
    <RoleProvider initialActor={actor}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar unreadCount={unreadNotificationCount} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </RoleProvider>
  );
}
