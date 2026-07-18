"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavForRole } from "./nav-items";
import { useRole } from "./role-context";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { activeRole } = useRole();
  const pathname = usePathname();
  const items = mobileNavForRole(activeRole);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium min-h-11",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
