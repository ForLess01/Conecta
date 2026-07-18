import "server-only";
import { requireUser } from "@/lib/supabase/session";

export async function getNotifications() {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,status,link_path,created_at,read_at")
    .eq("user_id", userId)
    .neq("status", "ARCHIVED")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron cargar las notificaciones: ${error.message}`);
  return data ?? [];
}

export async function getUnreadNotificationCount() {
  const { supabase, userId } = await requireUser();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "UNREAD");
  if (error) throw new Error(`No se pudo cargar el contador de notificaciones: ${error.message}`);
  return count ?? 0;
}
