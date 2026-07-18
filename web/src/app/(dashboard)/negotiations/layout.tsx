import { requireActiveRole } from "@/lib/supabase/session";

export default async function NegotiationsLayout({ children }: { children: React.ReactNode }) {
  await requireActiveRole(["productor", "comprador"]);
  return children;
}
