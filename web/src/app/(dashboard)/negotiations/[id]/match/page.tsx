import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getNegotiation, getOrder } from "@/lib/server/commerce/commerce";
import { uuidSchema } from "@/lib/server/commerce/validation";

export default async function ConversationalMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const negotiation = await getNegotiation(id);
  if (!negotiation?.orderId) notFound();
  const order = await getOrder(negotiation.orderId);
  if (!order) notFound();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary"><CheckCircle2 className="size-8" /></span>
      <div><h1 className="font-heading text-xl font-semibold">Acuerdo confirmado</h1><p className="mt-2 text-sm text-muted-foreground">La propuesta por {negotiation.productName} fue aceptada y generó la orden <span className="font-medium text-foreground">{order.id}</span>.</p></div>
      <Card className="w-full"><CardContent className="space-y-2 pt-6 text-left text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Comprador</span><span className="font-medium">{order.buyerName}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Contraparte</span><span className="font-medium">{negotiation.counterpartName}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><span className="font-medium">{order.status}</span></div>
      </CardContent></Card>
      <div className="flex w-full flex-col gap-2">
        <Button asChild size="lg"><Link href={`/orders/${order.id}/logistics`}>Continuar a logística</Link></Button>
        <Button asChild variant="outline" size="lg"><Link href={`/orders/${order.id}`}>Ver orden</Link></Button>
      </div>
    </div>
  );
}
