import Link from "next/link";
import { Bell } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { getNotifications } from "@/lib/server/notifications/queries";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/server/notifications/actions";

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const unread = notifications.filter((notification) => notification.status === "UNREAD");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <DesktopTopBar title="Notificaciones" description="Alertas reales de tu cuenta y actividad." />
        {unread.length > 0 && <form action={markAllNotificationsRead}><Button type="submit" variant="ghost" size="sm">Marcar todas</Button></form>}
      </div>
      {notifications.length === 0 ? <EmptyState icon={Bell} title="Sin notificaciones" description="Estás al día." /> : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <article key={notification.id} className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-start", notification.status === "UNREAD" && "border-primary/40 bg-secondary/40")}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><Bell className="size-4" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{notification.title}</p><p className="text-xs text-muted-foreground">{notification.body}</p><p className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(notification.created_at)}</p></div>
              <div className="flex shrink-0 gap-1">
                {notification.link_path && <Button variant="ghost" size="sm" asChild><Link href={notification.link_path}>Abrir</Link></Button>}
                {notification.status === "UNREAD" && <form action={markNotificationRead.bind(null, notification.id)}><Button type="submit" variant="ghost" size="sm">Marcar leída</Button></form>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
