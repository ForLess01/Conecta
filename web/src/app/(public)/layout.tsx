import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href="/" aria-label="Conecta, ir al inicio" className="flex items-center gap-2">
            <BrandLogo size={32} />
            <span className="font-heading text-lg font-semibold tracking-[-0.02em]">Conecta</span>
          </Link>
          <nav aria-label="Navegación pública" className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" asChild className="hidden lg:inline-flex">
              <Link href="/#como-funciona">Cómo funciona</Link>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <Link href="/marketplace">Marketplace</Link>
            </Button>
            <Button variant="ghost" asChild className="hidden lg:inline-flex">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild className="h-10 px-3 sm:px-4">
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
