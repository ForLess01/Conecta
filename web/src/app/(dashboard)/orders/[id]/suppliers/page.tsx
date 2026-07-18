"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { RiskBadge } from "@/components/marketplace/risk-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getOrderById } from "@/lib/mock/orders";
import { getProductById } from "@/lib/mock/products";
import { PRODUCERS } from "@/lib/mock/actors";
import { formatSoles } from "@/lib/format";
import type { RiskLevel } from "@/types/domain";

const PROPOSALS: { id: string; producerId: string; quantity: number; price: number; distanceKm: number; risk: RiskLevel }[] = [
  { id: "supplier-1", producerId: "prod-1", quantity: 2200, price: 1.52, distanceKm: 118, risk: "medio" },
  { id: "supplier-2", producerId: "prod-2", quantity: 2600, price: 1.58, distanceKm: 92, risk: "bajo" },
  { id: "supplier-3", producerId: "prod-3", quantity: 1800, price: 1.46, distanceKm: 164, risk: "alto" },
];

export default function SuppliersAllocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = getOrderById(id);
  const product = order ? getProductById(order.productId) : undefined;
  const [selected, setSelected] = useState<string[]>(["supplier-1"]);
  const router = useRouter();
  if (!order || !product) notFound();

  const required = 6000;
  const selection = PROPOSALS.filter((proposal) => selected.includes(proposal.id));
  const selectedQuantity = selection.reduce((sum, proposal) => sum + proposal.quantity, 0);
  const total = selection.reduce((sum, proposal) => sum + proposal.quantity * proposal.price, 0);
  const coverage = Math.min(100, Math.round((selectedQuantity / required) * 100));

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Combinar productores" description={`${product.name} · selecciona propuestas hasta cubrir ${required.toLocaleString("es-PE")} ${product.unit}`} />
      <Card><CardContent className="space-y-3 pt-6"><div className="flex items-end justify-between gap-3"><div><p className="text-sm text-muted-foreground">Cobertura seleccionada</p><p className="font-heading text-xl font-semibold tabular-nums">{selectedQuantity.toLocaleString("es-PE")} de {required.toLocaleString("es-PE")} {product.unit}</p></div><Badge variant={coverage === 100 ? "default" : "secondary"}>{coverage}%</Badge></div><Progress value={coverage} /><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="text-muted-foreground">Faltan {(Math.max(0, required - selectedQuantity)).toLocaleString("es-PE")} {product.unit}</span><span className="font-semibold">Costo combinado: {formatSoles(total)}</span></div></CardContent></Card>
      <div className="space-y-3">{PROPOSALS.map((proposal) => { const producer = PRODUCERS.find((item) => item.id === proposal.producerId); const active = selected.includes(proposal.id); return <Card key={proposal.id} className={active ? "border-primary" : undefined}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div className="space-y-2"><div><p className="font-medium">{producer?.name}</p><p className="text-sm text-muted-foreground">{proposal.quantity.toLocaleString("es-PE")} {product.unit} · {formatSoles(proposal.price)}/{product.unit} · {proposal.distanceKm} km</p></div><RiskBadge level={proposal.risk} showScore={false} /></div><Button variant={active ? "outline" : "default"} onClick={() => setSelected((current) => active ? current.filter((item) => item !== proposal.id) : [...current, proposal.id])}>{active ? "Quitar" : "Seleccionar propuesta"}</Button></CardContent></Card>; })}</div>
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => toast.info("Te avisaremos cuando lleguen nuevas propuestas.")}>Esperar más ofertas</Button><Button disabled={selectedQuantity < required} onClick={() => router.push(`/orders/${order.id}/logistics`)}>Combinar y continuar a logística</Button><Button asChild variant="ghost"><Link href={`/orders/${order.id}`}>Volver a la orden</Link></Button></div>
    </div>
  );
}
