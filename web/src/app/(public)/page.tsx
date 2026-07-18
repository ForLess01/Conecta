import Link from "next/link";
import { Search, Zap, MessagesSquare, ShieldAlert, Sprout, Truck, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/marketplace/product-card";
import { DemoBadge } from "@/components/marketplace/misc-badges";
import { PRODUCTS } from "@/lib/mock/products";
import { RiskBadge } from "@/components/marketplace/risk-badge";
import { ConfidenceBadge, FreshnessBadge } from "@/components/marketplace/confidence-badge";

const STEPS = [
  { title: "Publica o explora", detail: "Productores publican su cosecha, compradores exploran el marketplace." },
  { title: "Negocia", detail: "Oferta rápida con reglas claras o negociación conversacional con propuestas." },
  { title: "Organiza logística", detail: "Recojo propio, entrega del productor o transporte por marketplace." },
  { title: "Sigue el viaje", detail: "Riesgo de ruta, confianza y entrega con evidencias." },
];

const RECENT_ROUTES = [
  { from: "Acora", to: "Juliaca", km: 118 },
  { from: "Ilave", to: "Arequipa", km: 265 },
  { from: "Juli", to: "Puno", km: 82 },
];

export default function LandingPage() {
  const featured = PRODUCTS.slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,var(--secondary),transparent_60%)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:px-8 md:py-24">
          <div className="flex flex-col justify-center gap-6">
            <DemoBadge className="w-fit" />
            <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              Encuentra el producto, negocia el precio y organiza el transporte con información actualizada sobre costos y riesgos.
            </h1>
            <p className="max-w-lg text-base text-muted-foreground">
              Conecta une a productores, compradores y transportistas rurales del Perú en un solo lugar,
              con precios orientativos y riesgo territorial explicado, nunca impuesto.
            </p>
            <form className="flex max-w-md items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
              <Search className="ml-2 size-4 text-muted-foreground shrink-0" />
              <Input placeholder="Buscar papa, quinua, fibra de alpaca…" className="border-0 shadow-none focus-visible:ring-0" />
              <Button className="shrink-0">Buscar</Button>
            </form>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/register">Comenzar ahora</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/marketplace">Explorar marketplace</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Sprout, label: "Productor" },
                { icon: ShoppingBasket, label: "Comprador" },
                { icon: Truck, label: "Transportista" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 text-sm font-medium">Riesgo actual de acceso: corredor Ilave – Juliaca</p>
              <div className="flex flex-wrap items-center gap-2">
                <RiskBadge level="medio" score={38} />
                <ConfidenceBadge confidence={78} />
                <FreshnessBadge updatedAt="2026-07-17T18:00:00-05:00" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Nunca se etiqueta al productor como riesgoso: el riesgo es siempre del corredor y del transporte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Negotiation explanation */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Dos formas de negociar</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Zap className="size-5" />
            </span>
            <h3 className="mt-3 font-heading text-lg font-semibold">Negociación rápida</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Envía una oferta dentro de un rango sugerido. Si alcanza el mínimo del productor, hay match inmediato
              con reserva de 15 minutos. Si no, solo se indica que no fue aceptada, sin revelar cuánto faltó.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <MessagesSquare className="size-5" />
            </span>
            <h3 className="mt-3 font-heading text-lg font-semibold">Negociación conversacional</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Chatea con la contraparte, envía propuestas estructuradas con cantidad, precio, fecha y calidad, y
              compara contraofertas lado a lado antes de confirmar el acuerdo.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-secondary/40 py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Cómo funciona</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-border bg-card p-5">
                <span className="font-heading text-2xl font-semibold text-primary tabular-nums">{index + 1}</span>
                <p className="mt-2 font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Productos destacados</h2>
          <Button variant="ghost" asChild>
            <Link href="/marketplace">Ver todos</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Recent routes + testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">Rutas recientes</h2>
            <div className="mt-4 space-y-3">
              {RECENT_ROUTES.map((route) => (
                <div key={`${route.from}-${route.to}`} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <span className="text-sm font-medium">{route.from} → {route.to}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{route.km} km</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">Testimonios</h2>
              <DemoBadge />
            </div>
            <div className="space-y-3">
              <blockquote className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                “Ahora sé el rango de precio antes de negociar y entiendo por qué el flete cuesta lo que cuesta.” — Rosa M., productora de Mazocruz (demo)
              </blockquote>
              <blockquote className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                “La comparación de ofertas de transporte me ahorra horas de llamadas.” — Juan Pablo R., acopiador (demo)
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-forest px-6 py-12 text-center text-white" style={{ backgroundColor: "var(--forest)" }}>
          <ShieldAlert className="size-8" />
          <h2 className="font-heading text-2xl font-semibold">Negocia con información, no con incertidumbre</h2>
          <div className="flex gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Comenzar ahora</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-xs text-muted-foreground md:px-8">
          <p>Conecta — Marketplace rural peruano. Prototipo de demostración para hackathon.</p>
          <div className="flex gap-4">
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/register">Registrarse</Link>
            <Link href="/marketplace">Marketplace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
