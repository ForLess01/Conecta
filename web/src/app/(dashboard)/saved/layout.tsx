import { requireActiveRole } from "@/lib/supabase/session";

export default async function SavedLayout({ children }: { children: React.ReactNode }) {
  await requireActiveRole(["productor", "comprador", "transportista"]);
  return children;
}
