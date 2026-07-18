import { NegotiationsInbox } from "@/components/negotiation/negotiations-inbox";
import { listNegotiations } from "@/lib/server/commerce/commerce";

export default async function NegotiationsInboxPage() {
  return <NegotiationsInbox negotiations={await listNegotiations()} />;
}
