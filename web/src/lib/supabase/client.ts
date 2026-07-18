import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types.gen";

export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
