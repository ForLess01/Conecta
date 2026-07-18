import Link from "next/link";
import { Coins, RotateCcw } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PACKAGES = [{ credits: 10, price: "S/ 25" }, { credits: 30, price: "S/ 60" }, { credits: 80, price: "S/ 140" }];

export default function CreditsPage() {
  return (
    <div className="space-y-6">
      <DesktopTopBar title="Créditos" description="Administra el saldo que usarás para postular a cargas destacadas." />
      <Card className="bg-forest text-white"><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><Badge variant="secondary">Próxima fase</Badge><p className="mt-3 font-heading text-2xl font-semibold">Las postulaciones actuales no consumen créditos</p><p className="mt-1 text-sm text-white/75">No mostramos saldos ni movimientos simulados.</p></div><Coins className="size-10 text-mint" /></CardContent></Card>
      <div className="grid gap-4 md:grid-cols-3">{PACKAGES.map((item) => <Card key={item.credits}><CardContent className="space-y-4 pt-6"><p className="font-heading text-2xl font-semibold">{item.credits} créditos</p><p className="text-sm text-muted-foreground">Paquete previsto para cargas destacadas.</p><div className="flex items-center justify-between"><span className="font-semibold">{item.price}</span><Button asChild variant="outline"><Link href="mailto:contacto@conecta.pe?subject=Créditos%20Conecta">Notificarme</Link></Button></div></CardContent></Card>)}</div>
      <Card><CardHeader><CardTitle className="font-heading text-base">Cómo funcionan</CardTitle></CardHeader><CardContent className="flex gap-3 text-sm text-muted-foreground"><RotateCcw className="size-5 shrink-0 text-primary" /><p>Se descuenta un crédito al enviar una postulación destacada. Si la carga se cancela o la solicitud vence sin selección, el crédito vuelve automáticamente a tu saldo.</p></CardContent></Card>
      <Card><CardHeader><CardTitle className="font-heading text-base">Historial</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">El historial aparecerá cuando se habilite el sistema de créditos.</p></CardContent></Card>
    </div>
  );
}
