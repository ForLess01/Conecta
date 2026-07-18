import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getMarketplaceCatalogs } from "@/lib/server/catalogs/queries";
import { createOffer } from "./actions";
import { getMyActorContext } from "@/lib/supabase/session";
import { redirect } from "next/navigation";

export default async function PublishOfferPage() {
  const actor = await getMyActorContext();
  if (actor?.activeRole !== "productor") redirect("/home");
  const { products, units } = await getMarketplaceCatalogs();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DesktopTopBar title="Publicar producto" description="Creá una oferta activa con datos reales del catálogo." />
      <form action={createOffer} className="space-y-5">
        <Card><CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field label="Producto" htmlFor="productId"><select id="productId" name="productId" required className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"><option value="">Seleccionar</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Variedad (opcional)" htmlFor="varietyId"><select id="varietyId" name="varietyId" className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"><option value="">Sin variedad</option>{products.flatMap((p) => p.varieties.map((v) => <option key={v.id} value={v.id}>{p.name} · {v.name}</option>))}</select></Field>
          <Field label="Título" htmlFor="title" wide><Input id="title" name="title" required placeholder="Ej. Papa Canchán seleccionada" /></Field>
          <Field label="Descripción" htmlFor="description" wide><Textarea id="description" name="description" placeholder="Calidad, cosecha y condiciones de entrega" /></Field>
          <Field label="Cantidad" htmlFor="quantity"><Input id="quantity" name="quantity" type="number" min="0.01" step="0.01" required /></Field>
          <Field label="Unidad" htmlFor="unitId"><select id="unitId" name="unitId" required className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"><option value="">Seleccionar</option>{units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}</select></Field>
          <Field label="Pedido mínimo" htmlFor="minimumOrderQuantity"><Input id="minimumOrderQuantity" name="minimumOrderQuantity" type="number" min="0.01" step="0.01" required /></Field>
          <Field label="Disponible desde" htmlFor="availableFrom"><Input id="availableFrom" name="availableFrom" type="date" /></Field>
          <Field label="Ubicación aproximada" htmlFor="locationLabel" wide><Input id="locationLabel" name="locationLabel" required placeholder="Ej. Acora, Puno" /></Field>
          <Field label="Latitud" htmlFor="latitude"><Input id="latitude" name="latitude" type="number" min="-90" max="90" step="0.000001" required /></Field>
          <Field label="Longitud" htmlFor="longitude"><Input id="longitude" name="longitude" type="number" min="-180" max="180" step="0.000001" required /></Field>
          <Field label="Ventana de conversación (horas)" htmlFor="conversationHours"><Input id="conversationHours" name="conversationHours" type="number" min="1" defaultValue="24" required /></Field>
          <Field label="Mínimo privado por unidad" htmlFor="hiddenFloorPrice"><Input id="hiddenFloorPrice" name="hiddenFloorPrice" type="number" min="0.01" step="0.01" /><p className="text-xs text-muted-foreground">Obligatorio si activás negociación rápida. Nunca se expone al comprador.</p></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allowPartial" defaultChecked /> Permitir cantidades parciales</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="quickNegotiation" /> Activar negociación rápida</label>
        </CardContent></Card>
        <div className="flex justify-end"><Button type="submit" name="intent" value="publish">Publicar</Button></div>
      </form>
    </div>
  );
}

function Field({ label, htmlFor, wide, children }: { label: string; htmlFor: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
