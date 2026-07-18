"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { NOTIFICATIONS } from "@/lib/mock/notifications";

export function TopBar({ title }: { title?: string }) {
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
      <Link href="/home" className="flex items-center gap-2">
        <BrandLogo size={26} />
        {title ? (
          <span className="font-heading text-sm font-semibold">{title}</span>
        ) : (
          <span className="font-heading text-sm font-semibold">Conecta</span>
        )}
      </Link>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/notifications" aria-label={`Notificaciones: ${unread} sin leer`}>
            <Bell className="size-5" aria-hidden="true" />
            {unread > 0 && (
              <span aria-hidden="true" className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
            )}
            <span className="sr-only">{unread} notificaciones sin leer</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}

export function DesktopTopBar({ title, description }: { title: string; description?: string }) {
  return (
    <div className="hidden md:block mb-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}
