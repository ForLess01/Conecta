import "server-only";
import { requireUser } from "@/lib/supabase/session";
import { getActiveListings } from "@/lib/server/marketplace/queries";

export interface PublicActorProfile {
  id: string;
  name: string;
  kind: "PERSON" | "ORGANIZATION";
  verification: string;
  verificationName: string;
  memberSince: string;
  roles: string[];
  locations: { label: string; name: string }[];
}

export async function getPublicActorProfile(id: string) {
  const { supabase, userId } = await requireUser();
  const [profileResult, savedResult, listings] = await Promise.all([
    supabase.rpc("get_public_actor_profile", { p_actor_id: id }),
    supabase.from("saved_actors").select("actor_id").eq("user_id", userId).eq("actor_id", id).maybeSingle(),
    getActiveListings(),
  ]);
  if (profileResult.error) throw new Error(`No se pudo cargar el perfil: ${profileResult.error.message}`);
  if (savedResult.error) throw new Error(`No se pudo consultar el perfil guardado: ${savedResult.error.message}`);
  return {
    profile: (profileResult.data ?? null) as PublicActorProfile | null,
    saved: Boolean(savedResult.data),
    listings: listings.filter((listing) => listing.actorId === id),
  };
}
