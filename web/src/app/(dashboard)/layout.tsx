import { RoleProvider } from "@/components/layout/role-context";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import { DemoDataBanner } from "@/components/shared/demo-data-banner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
            <div className="mb-4">
              <DemoDataBanner />
            </div>
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </RoleProvider>
  );
}
