import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ROLE_COOKIE } from "@/lib/roles";
import type { UserRole } from "@/types/domain";

export interface ActorContext {
  id: string;
  name: string;
  roles: UserRole[];
  activeRole: UserRole;
}

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) redirect("/login");

  return { supabase, userId: data.claims.sub };
}

export async function getMyActorContext(): Promise<ActorContext | null> {
  const { supabase } = await requireUser();
  const [{ data, error }, { data: isAdmin, error: adminError }] = await Promise.all([
    supabase.rpc("get_my_actor_context"),
    supabase.rpc("is_admin"),
  ]);

  if (error) throw new Error(`Could not load actor context: ${error.message}`);
  if (adminError) throw new Error(`Could not load admin context: ${adminError.message}`);
  if (!data?.length) return null;

  const actor = data[0] as {
    actor_id: string;
    display_name: string;
    role_codes: string[] | null;
  };

  const roles: UserRole[] = (actor.role_codes ?? []).filter(
    (role): role is UserRole =>
      role === "productor" || role === "comprador" || role === "transportista",
  );
  if (isAdmin) roles.push("admin");
  if (roles.length === 0) return null;

  const storedRole = (await cookies()).get(ACTIVE_ROLE_COOKIE)?.value as UserRole | undefined;
  const activeRole = storedRole && roles.includes(storedRole) ? storedRole : roles[0];

  return {
    id: actor.actor_id,
    name: actor.display_name,
    roles,
    activeRole,
  };
}

export async function requireActiveRole(allowedRoles: readonly UserRole[]) {
  const actor = await getMyActorContext();
  if (!actor || !allowedRoles.includes(actor.activeRole)) redirect("/home");
  return actor;
}
