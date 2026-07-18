"use client";

import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PRICE_OBSERVATIONS } from "@/lib/mock/admin";
import { formatSoles, formatDate } from "@/lib/format";
import { Upload } from "lucide-react";

export default function AdminPricesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DesktopTopBar title="Observaciones de precios" description="Precios de referencia que alimentan el motor de sugerencia de precio." />
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast.success("CSV importado.")}>
            <Upload className="size-4" /> Importar CSV
          </Button>
          <Button onClick={() => toast.info("Formulario de nueva observación.")}>Registrar observación</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Mercado</TableHead>
              <TableHead>Región</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Bajo</TableHead>
              <TableHead>Medio</TableHead>
              <TableHead>Alto</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PRICE_OBSERVATIONS.map((obs) => (
              <TableRow key={obs.id}>
                <TableCell>{obs.product} · {obs.variety}</TableCell>
                <TableCell>{obs.market}</TableCell>
                <TableCell>{obs.region}</TableCell>
                <TableCell>{formatDate(obs.date)}</TableCell>
                <TableCell className="tabular-nums">{formatSoles(obs.low)}</TableCell>
                <TableCell className="tabular-nums">{formatSoles(obs.central)}</TableCell>
                <TableCell className="tabular-nums">{formatSoles(obs.high)}</TableCell>
                <TableCell className="max-w-40 truncate text-xs text-muted-foreground">{obs.source}</TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button variant="ghost" size="sm">Editar</Button>
                  <Button variant="ghost" size="sm">Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
