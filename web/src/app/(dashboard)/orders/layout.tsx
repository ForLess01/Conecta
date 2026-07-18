import { requireActiveRole } from "@/lib/supabase/session";

export default async function OrdersLayout({ children }: { children: React.ReactNode }) {
  await requireActiveRole(["productor", "comprador"]);
  return children;
}
