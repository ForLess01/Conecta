import "server-only";
import { requireUser } from "@/lib/supabase/session";
import { getActiveListings } from "@/lib/server/marketplace/queries";

export async function getSavedData() {
  const { supabase, userId } = await requireUser();
  const [listings, actorsResult] = await Promise.all([
    getActiveListings(),
    supabase.from("saved_actors").select("actor_id,actors(id,display_name,kind,verification_statuses(code,name))").eq("user_id", userId),
  ]);
  if (actorsResult.error) throw new Error(`No se pudieron cargar los perfiles guardados: ${actorsResult.error.message}`);
  return {
    listings: listings.filter((listing) => listing.saved),
    actors: (actorsResult.data ?? []).flatMap((item) => item.actors ?? []),
  };
}
