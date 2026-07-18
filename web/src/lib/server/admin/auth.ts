import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export class AdminAuthorizationError extends Error {
  constructor() {
    super("Supabase ADMIN role required.");
    this.name = "AdminAuthorizationError";
  }
}

export async function getAdminContext() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) throw new AdminAuthorizationError();

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
  if (roleError || !isAdmin) throw new AdminAuthorizationError();

  return { supabase, userId };
}

export async function requireAdminPage() {
  try {
    return await getAdminContext();
  } catch (error) {
    if (error instanceof AdminAuthorizationError) redirect("/");
    throw error;
  }
}
