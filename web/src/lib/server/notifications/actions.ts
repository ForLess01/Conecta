"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/session";

export async function markNotificationRead(id: string) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("notifications")
    .update({ status: "READ", read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(`No se pudo marcar la notificación: ${error.message}`);
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("notifications")
    .update({ status: "READ", read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "UNREAD");
  if (error) throw new Error(`No se pudieron marcar las notificaciones: ${error.message}`);
  revalidatePath("/notifications");
}
