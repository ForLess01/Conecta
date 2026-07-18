"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/session";

export async function toggleSavedListing(listingId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("toggle_saved_listing", { p_listing_id: listingId });
  if (error) throw new Error(`No se pudo actualizar el guardado: ${error.message}`);
  revalidatePath("/marketplace");
  revalidatePath("/saved");
  return { saved: Boolean(data) };
}

export async function toggleSavedActor(actorId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("toggle_saved_actor", { p_actor_id: actorId });
  if (error) throw new Error(`No se pudo actualizar el perfil guardado: ${error.message}`);
  revalidatePath("/saved");
  revalidatePath(`/profiles/${actorId}`);
  return { saved: Boolean(data) };
}
