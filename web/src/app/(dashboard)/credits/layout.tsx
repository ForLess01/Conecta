import { requireActiveRole } from "@/lib/supabase/session";

export default async function CreditsLayout({ children }: { children: React.ReactNode }) {
  await requireActiveRole(["transportista"]);
  return children;
}
