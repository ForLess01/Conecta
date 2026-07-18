import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { requireUser } from "@/lib/supabase/session";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={28} />
            <span className="font-heading text-base font-semibold tracking-tight">Conecta</span>
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
