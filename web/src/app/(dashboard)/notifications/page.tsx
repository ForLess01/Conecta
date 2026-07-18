"use client";

import { useState } from "react";
import Link from "next/link";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { NOTIFICATIONS } from "@/lib/mock/notifications";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { Bell, MessagesSquare, ClipboardList, Truck, ShieldAlert, Settings } from "lucide-react";
import type { Notification } from "@/types/domain";

const CATEGORY_ICON: Record<Notification["category"], typeof Bell> = {
  negociacion: MessagesSquare,
  orden: ClipboardList,
  transporte: Truck,
  riesgo: ShieldAlert,
  sistema: Settings,
};

const CATEGORIES: { value: Notification["category"] | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "negociacion", label: "Negociación" },
  { value: "orden", label: "Orden" },
  { value: "transporte", label: "Transporte" },
  { value: "riesgo", label: "Riesgo" },
  { value: "sistema", label: "Sistema" },
];

export default function NotificationsPage() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]["value"]>("todas");

  const filtered = items.filter((n) => filter === "todas" || n.category === filter);

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <DesktopTopBar title="Notificaciones" description="Todas tus alertas de negociación, orden, transporte y riesgo." />
        <Button variant="ghost" size="sm" onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}>
          Marcar todas
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === cat.value ? "border-primary bg-secondary" : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="Sin notificaciones" description="Estás al día." />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = CATEGORY_ICON[n.category];
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border border-border bg-card p-4",
                  !n.read && "border-primary/40 bg-secondary/40"
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.detail}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={n.href}>Abrir</Link>
                  </Button>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                      Marcar leída
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
