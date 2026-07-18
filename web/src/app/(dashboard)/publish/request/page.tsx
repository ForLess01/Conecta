import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getMarketplaceCatalogs } from "@/lib/server/catalogs/queries";
import { createRequest } from "./actions";

export default async function PublishRequestPage() {
  const { products, units } = await getMarketplaceCatalogs();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DesktopTopBar title="Publicar requerimiento" description="Indicá qué necesitás, cuánto y dónde debe entregarse." />
      <form action={createRequest} className="space-y-5">
        <Card><CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field label="Producto" htmlFor="productId"><select id="productId" name="productId" required className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"><option value="">Seleccionar</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Variedad (opcional)" htmlFor="varietyId"><select id="varietyId" name="varietyId" className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"><option value="">Sin variedad</option>{products.flatMap((p) => p.varieties.map((v) => <option key={v.id} value={v.id}>{p.name} · {v.name}</option>))}</select></Field>
          <Field label="Título" htmlFor="title" wide><Input id="title" name="title" required placeholder="Ej. Compra semanal de quinua blanca" /></Field>
          <Field label="Calidad y condiciones" htmlFor="description" wide><Textarea id="description" name="description" placeholder="Calibre, certificaciones o condiciones requeridas" /></Field>
          <Field label="Cantidad" htmlFor="quantity"><Input id="quantity" name="quantity" type="number" min="0.01" step="0.01" required /></Field>
          <Field label="Unidad" htmlFor="unitId"><select id="unitId" name="unitId" required className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"><option value="">Seleccionar</option>{units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}</select></Field>
          <Field label="Cierre de propuestas" htmlFor="deadline"><Input id="deadline" name="deadline" type="date" required /></Field>
          <Field label="Fecha de entrega" htmlFor="deliveryDeadline"><Input id="deliveryDeadline" name="deliveryDeadline" type="date" /></Field>
          <Field label="Destino aproximado" htmlFor="locationLabel" wide><Input id="locationLabel" name="locationLabel" required placeholder="Ej. Mercado San Camilo, Arequipa" /></Field>
          <Field label="Latitud" htmlFor="latitude"><Input id="latitude" name="latitude" type="number" min="-90" max="90" step="0.000001" required /></Field>
          <Field label="Longitud" htmlFor="longitude"><Input id="longitude" name="longitude" type="number" min="-180" max="180" step="0.000001" required /></Field>
          <div className="space-y-3 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="acceptsPartial" defaultChecked /> Aceptar ofertas parciales</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="acceptsMultiple" defaultChecked /> Aceptar múltiples productores</label>
          </div>
        </CardContent></Card>
        <div className="flex justify-end gap-2">
          <Button type="submit" name="intent" value="draft" variant="outline">Guardar borrador</Button>
          <Button type="submit" name="intent" value="publish">Publicar</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, htmlFor, wide, children }: { label: string; htmlFor: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
