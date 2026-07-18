import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatSoles } from "@/lib/format";
import { listOrders } from "@/lib/server/commerce/commerce";

export default async function OrdersListPage() {
  const orders = await listOrders();
  return <div className="space-y-6">
    <DesktopTopBar title="Órdenes" description="Órdenes comerciales generadas por acuerdos confirmados." />
    {orders.length === 0 ? <EmptyState icon={ClipboardList} title="Sin órdenes" description="Cuando confirmes un acuerdo aparecerá aquí." /> : <div className="space-y-3">
      {orders.map((order) => <Card key={order.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
        <div><p className="font-heading font-semibold">Orden {order.id}</p><p className="text-sm text-muted-foreground">{order.items.map((item) => item.productName).join(", ")}</p><p className="text-xs text-muted-foreground">{order.status.replaceAll("_", " ")}</p></div>
        <div className="flex items-center gap-4"><span className="font-heading font-semibold tabular-nums">{formatSoles(order.total)}</span><Button variant="outline" size="sm" asChild><Link href={`/orders/${order.id}`}>Ver detalle</Link></Button></div>
      </CardContent></Card>)}
    </div>}
  </div>;
}
