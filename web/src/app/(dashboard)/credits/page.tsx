import { Coins, RotateCcw } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PACKAGES = [{ credits: 10, price: "S/ 25" }, { credits: 30, price: "S/ 60" }, { credits: 80, price: "S/ 140" }];

export default function CreditsPage() {
  return (
    <div className="space-y-6">
      <DesktopTopBar title="Créditos" description="Administra el saldo que usarás para postular a cargas destacadas." />
      <Card className="bg-forest text-white"><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="text-sm text-white/75">Saldo actual</p><p className="font-heading text-3xl font-semibold tabular-nums">18 créditos</p></div><Coins className="size-10 text-mint" /></CardContent></Card>
      <div className="grid gap-4 md:grid-cols-3">{PACKAGES.map((item) => <Card key={item.credits}><CardContent className="space-y-4 pt-6"><Badge variant="secondary">Próxima fase</Badge><p className="font-heading text-2xl font-semibold">{item.credits} créditos</p><p className="text-sm text-muted-foreground">Desbloquea postulaciones a cargas con alta demanda.</p><div className="flex items-center justify-between"><span className="font-semibold">{item.price}</span><Button disabled>Comprar</Button></div></CardContent></Card>)}</div>
      <Card><CardHeader><CardTitle className="font-heading text-base">Cómo funcionan</CardTitle></CardHeader><CardContent className="flex gap-3 text-sm text-muted-foreground"><RotateCcw className="size-5 shrink-0 text-primary" /><p>Se descuenta un crédito al enviar una postulación destacada. Si la carga se cancela o la solicitud vence sin selección, el crédito vuelve automáticamente a tu saldo.</p></CardContent></Card>
      <Card><CardHeader><CardTitle className="font-heading text-base">Historial</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Concepto</TableHead><TableHead className="text-right">Movimiento</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>18 jul 2026</TableCell><TableCell>Postulación a carga Puno – Arequipa</TableCell><TableCell className="text-right tabular-nums">−1</TableCell></TableRow><TableRow><TableCell>17 jul 2026</TableCell><TableCell>Devolución por carga cancelada</TableCell><TableCell className="text-right text-primary tabular-nums">+1</TableCell></TableRow></TableBody></Table></CardContent></Card>
    </div>
  );
}
