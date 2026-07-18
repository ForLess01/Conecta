import { requireActiveRole } from "@/lib/supabase/session";

export default async function TripsLayout({ children }: { children: React.ReactNode }) {
  await requireActiveRole(["transportista", "admin"]);
  return children;
}
