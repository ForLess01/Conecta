"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Settings } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { navForRole } from "./nav-items";
import { useRole } from "./role-context";
import { RoleSwitcher } from "./role-switcher";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { activeRole } = useRole();
  const pathname = usePathname();
  const items = navForRole(activeRole);

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-card h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-5">
        <Logo size={30} />
        <span className="font-heading text-lg font-semibold tracking-tight">Conecta</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-2">
        <RoleSwitcher />
        <div className="flex items-center gap-1 px-1">
          <Link
            href="/settings"
            className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
          >
            <Settings className="size-4" /> Configuración
          </Link>
          <Link
            href="/notifications"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
          >
            <HelpCircle className="size-4" /> Ayuda
          </Link>
        </div>
      </div>
    </aside>
  );
}
