"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatSoles } from "@/lib/format";
import type { PriceObservation } from "@/lib/server/pricing/observations";

interface Catalogs {
  products: Array<{ id: string; name: string }>;
  varieties: Array<{ id: string; name: string; product_id: string }>;
  areas: Array<{ id: string; name: string }>;
  sources: Array<{ id: number; name: string }>;
  units: Array<{ id: number; name: string; symbol: string }>;
  currencies: Array<{ id: number; code: string; symbol: string }>;
}

export function PriceObservationsManager({ observations, catalogs }: { observations: PriceObservation[]; catalogs: Catalogs }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const optionalNumber = (name: string) => form.get(name) ? Number(form.get(name)) : null;
    try {
      const response = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: form.get("productId"),
          varietyId: form.get("varietyId") || null,
          administrativeAreaId: form.get("administrativeAreaId") || null,
          marketName: form.get("marketName") || null,
          observedOn: form.get("observedOn"),
          unitId: Number(form.get("unitId")),
          currencyId: Number(form.get("currencyId")),
          priceLow: optionalNumber("priceLow"),
          priceMid: Number(form.get("priceMid")),
          priceHigh: optionalNumber("priceHigh"),
          sourceId: Number(form.get("sourceId")),
          sourceUrl: form.get("sourceUrl") || null,
        }),
      });
      if (!response.ok) throw new Error("No se pudo registrar la observación.");
      toast.success("Observación registrada.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falló el registro.");
    } finally {
      setBusy(false);
    }
  }

  async function importCsv(file: File) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/prices/import", { method: "POST", headers: { "Content-Type": "text/csv" }, body: file });
      const result = await response.json() as { imported?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? "No se pudo importar el CSV.");
      toast.success(`${result.imported ?? 0} observaciones importadas.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falló la importación.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function edit(observation: PriceObservation) {
    const value = window.prompt("Nuevo precio medio", String(observation.mid));
    if (!value) return;
    const priceMid = Number(value);
    if (!Number.isFinite(priceMid) || priceMid <= 0) return toast.error("Ingresá un precio válido.");
    const response = await fetch(`/api/admin/prices/${observation.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceMid }) });
    if (!response.ok) return toast.error("No se pudo editar la observación.");
    toast.success("Observación actualizada.");
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar esta observación?")) return;
    const response = await fetch(`/api/admin/prices/${id}`, { method: "DELETE" });
    if (!response.ok) return toast.error("No se pudo eliminar la observación.");
    toast.success("Observación eliminada.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <input ref={fileRef} className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && importCsv(event.target.files[0])} />
        <Button variant="outline" className="gap-2" disabled={busy} onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Importar CSV</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button disabled={busy} />}>Registrar observación</DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>Nueva observación</DialogTitle><DialogDescription>Registrá el precio y su fuente trazable.</DialogDescription></DialogHeader>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={create}>
              <Field label="Producto"><select name="productId" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">{catalogs.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
              <Field label="Variedad"><select name="varietyId" className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Sin variedad</option>{catalogs.varieties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
              <Field label="Mercado"><Input name="marketName" maxLength={120} /></Field>
              <Field label="Región"><select name="administrativeAreaId" className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Sin región</option>{catalogs.areas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
              <Field label="Fecha"><Input name="observedOn" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
              <Field label="Fuente"><select name="sourceId" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">{catalogs.sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
              <Field label="Precio bajo"><Input name="priceLow" type="number" min="0.01" step="0.01" /></Field>
              <Field label="Precio medio"><Input name="priceMid" type="number" min="0.01" step="0.01" required /></Field>
              <Field label="Precio alto"><Input name="priceHigh" type="number" min="0.01" step="0.01" /></Field>
              <Field label="Unidad"><select name="unitId" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">{catalogs.units.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.symbol})</option>)}</select></Field>
              <Field label="Moneda"><select name="currencyId" required className="h-9 w-full rounded-md border bg-background px-3 text-sm">{catalogs.currencies.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></Field>
              <Field label="URL de fuente"><Input name="sourceUrl" type="url" /></Field>
              <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={busy} type="submit">Guardar</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border"><Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Mercado</TableHead><TableHead>Región</TableHead><TableHead>Fecha</TableHead><TableHead>Bajo</TableHead><TableHead>Medio</TableHead><TableHead>Alto</TableHead><TableHead>Fuente</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>
        {observations.map((obs) => <TableRow key={obs.id}><TableCell>{obs.product}{obs.variety ? ` · ${obs.variety}` : ""}</TableCell><TableCell>{obs.market ?? "—"}</TableCell><TableCell>{obs.region ?? "—"}</TableCell><TableCell>{formatDate(obs.observedOn)}</TableCell><TableCell>{obs.low === null ? "—" : formatSoles(obs.low)}</TableCell><TableCell>{formatSoles(obs.mid)}</TableCell><TableCell>{obs.high === null ? "—" : formatSoles(obs.high)}</TableCell><TableCell className="max-w-40 truncate text-xs text-muted-foreground">{obs.source}</TableCell><TableCell className="space-x-1 text-right"><Button variant="ghost" size="sm" onClick={() => edit(obs)}>Editar</Button><Button variant="ghost" size="sm" onClick={() => remove(obs.id)}>Eliminar</Button></TableCell></TableRow>)}
        {observations.length === 0 ? <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No hay observaciones registradas.</TableCell></TableRow> : null}
      </TableBody></Table></div>
      <p className="text-xs text-muted-foreground">CSV: product_code, observed_on, price_mid, source_code, unit_code y currency_code. Opcionales: variety_code, market_name, price_low, price_high y source_url.</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
