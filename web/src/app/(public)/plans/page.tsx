import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PLANS = [
  { name: "Gratuito", price: "S/ 0", description: "Para comprar de forma directa.", features: ["Marketplace completo", "Negociaciones y órdenes", "Alertas esenciales"], href: "/register", action: "Crear cuenta gratuita" },
  { name: "Profesional", price: "S/ 89 / mes", description: "Para equipos de compra recurrente.", features: ["Filtros avanzados", "Alertas personalizadas", "Comparación de proveedores"], href: "mailto:contacto@conecta.pe?subject=Plan%20Profesional", action: "Solicitar información" },
  { name: "Empresarial", price: "A medida", description: "Para organizaciones con varias sedes.", features: ["Usuarios y permisos", "Analítica consolidada", "Acompañamiento dedicado"], href: "mailto:contacto@conecta.pe?subject=Plan%20Empresarial", action: "Contactar" },
];

export default function PlansPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="secondary">Próxima fase</Badge>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight">Planes claros para cada etapa de compra</h1>
        <p className="mt-3 text-muted-foreground">Las funciones base permanecen disponibles sin costo. Los planes avanzados se habilitarán sin cambios automáticos ni cargos sorpresa.</p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <section key={plan.name} className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-xl font-semibold">{plan.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
            <p className="mt-6 font-heading text-2xl font-semibold">{plan.price}</p>
            <ul className="my-6 flex-1 space-y-3 text-sm">
              {plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 size-4 text-primary" /> {feature}</li>)}
            </ul>
            <Button asChild className="w-full"><Link href={plan.href}>{plan.action}</Link></Button>
          </section>
        ))}
      </div>
      <div className="mt-8 text-center"><Button asChild variant="ghost"><Link href="/register">Crear una cuenta gratuita</Link></Button></div>
    </div>
  );
}
