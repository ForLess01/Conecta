import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  MessagesSquare,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Truck,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ConfidenceBadge, FreshnessBadge } from "@/components/marketplace/confidence-badge";
import { ProductCard } from "@/components/marketplace/product-card";
import { RiskBadge } from "@/components/marketplace/risk-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { img } from "@/lib/images";
import { PRODUCERS } from "@/lib/mock/actors";
import { PRODUCTS } from "@/lib/mock/products";
import { getActiveListings } from "@/lib/server/marketplace/queries";
import type { MarketplaceListing } from "@/lib/server/marketplace/types";

const ACTORS = [
  {
    icon: Sprout,
    title: "Productores",
    detail: "Publican su cosecha y negocian sin revelar su mínimo privado.",
  },
  {
    icon: ShoppingBasket,
    title: "Compradores",
    detail: "Encuentran oferta rural y comparan condiciones antes de decidir.",
  },
  {
    icon: Truck,
    title: "Transportistas",
    detail: "Acceden a cargas, rutas y oportunidades de retorno.",
  },
];

const STEPS = [
  ["01", "Encuentra", "Explora productos o publica lo que necesitas."],
  ["02", "Negocia", "Elige una oferta rápida o conversa las condiciones."],
  ["03", "Organiza", "Define recojo, entrega o contrata transporte."],
  ["04", "Acompaña", "Sigue el viaje y registra la entrega con evidencia."],
];

const DEMO_ROUTES = [
  { from: "Acora", to: "Juliaca", km: 118, status: "Riesgo moderado" },
  { from: "Ilave", to: "Arequipa", km: 265, status: "Ruta monitoreada" },
  { from: "Juli", to: "Puno", km: 82, status: "Acceso disponible" },
];

const DEMO_FEATURED: MarketplaceListing[] = PRODUCTS.slice(0, 3).map((product) => ({
  id: product.id,
  type: "offer",
  actorId: product.producerId,
  actorName: PRODUCERS.find((producer) => producer.id === product.producerId)?.name ?? "Productor de Conecta",
  productId: product.id,
  productName: product.name,
  varietyId: null,
  varietyName: product.variety,
  title: product.name,
  description: product.description,
  quantity: product.quantityAvailable,
  unitId: 0,
  unitSymbol: product.unit,
  locationLabel: `${product.location.district}, ${product.location.region}`,
  availableFrom: null,
  deadlineAt: null,
  createdAt: product.risk.updatedAt,
  minimumOrderQuantity: product.minOrder,
  allowPartialQuantity: false,
  acceptsPartialOffers: false,
  acceptsMultipleSuppliers: false,
  quickNegotiationEnabled: product.quickOfferEnabled,
  conversationalWindowHours: product.negotiationWindowHours,
  saved: false,
}));

function getListingImage(listing: MarketplaceListing) {
  const listingLabel = `${listing.title} ${listing.productName}`.toLocaleLowerCase("es-PE");
  return PRODUCTS.find((product) => listingLabel.includes(product.name.toLocaleLowerCase("es-PE")))?.photos[0];
}

export default async function LandingPage() {
  let featured: MarketplaceListing[];

  try {
    const liveFeatured = await getActiveListings({ type: "OFFER", limit: 3 });
    const demoFill = DEMO_FEATURED.filter(
      (demo) => !liveFeatured.some((listing) => {
        const liveLabel = `${listing.title} ${listing.productName}`.toLocaleLowerCase("es-PE");
        return liveLabel.includes(demo.productName.toLocaleLowerCase("es-PE"));
      }),
    );
    featured = [...liveFeatured, ...demoFill].slice(0, 3);
  } catch {
    featured = DEMO_FEATURED;
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <section className="relative isolate bg-forest text-white">
        <div className="absolute inset-0 -z-20">
          <Image
            src={img("heroAndes", 1600)}
            alt="Parcelas agrícolas del altiplano peruano entre montañas"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,63,50,0.98)_0%,rgba(7,63,50,0.9)_43%,rgba(7,63,50,0.35)_78%,rgba(7,63,50,0.18)_100%)]" />

        <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.75fr)] lg:py-20">
          <div className="min-w-0 max-w-3xl">
            <div className="mb-7 flex items-center gap-3 text-white/85">
              <BrandLogo size={36} tile />
              <p className="text-sm font-medium">Abastecimiento rural conectado</p>
            </div>
            <h1 className="max-w-2xl text-balance font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-[3.25rem]">
              Del campo al mercado, con el transporte resuelto.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/82 sm:text-lg">
              Compra, vende y mueve productos rurales con precios orientativos, negociación flexible y riesgo de ruta actualizado.
            </p>

            <form
              action="/marketplace"
              method="get"
              role="search"
              className="mt-8 flex max-w-xl flex-col gap-2 rounded-xl bg-white p-2 text-foreground shadow-[0_8px_24px_rgba(3,24,19,0.22)] sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Search className="ml-2 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <label htmlFor="landing-search" className="sr-only">
                  Buscar productos en el marketplace
                </label>
                <Input
                  id="landing-search"
                  name="q"
                  type="search"
                  autoComplete="off"
                  placeholder="Busca papa, quinua o fibra de alpaca"
                  className="h-11 min-w-0 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button type="submit" className="h-11 px-5">
                Buscar productos
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
              <Link href="/register" className="inline-flex items-center gap-2 font-semibold text-white hover:underline hover:underline-offset-4">
                Crear una cuenta <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/marketplace" className="text-white/75 hover:text-white">
                Explorar marketplace
              </Link>
            </div>
          </div>

          <div className="min-w-0 self-end lg:self-center">
            <div className="ml-auto w-full max-w-sm rounded-2xl bg-white p-5 text-foreground shadow-[0_16px_40px_rgba(3,24,19,0.25)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Corredor monitoreado</p>
                  <p className="mt-1 font-heading text-lg font-semibold">Ilave a Juliaca</p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                  <MapPin className="size-5" aria-hidden="true" />
                </span>
              </div>
              <div className="my-5 flex items-center gap-2" aria-hidden="true">
                <span className="size-3 rounded-full bg-primary" />
                <span className="h-px flex-1 bg-[linear-gradient(90deg,var(--primary),var(--risk-medium))]" />
                <span className="size-3 rounded-full bg-[color:var(--risk-medium)]" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RiskBadge level="medio" score={38} />
                <ConfidenceBadge confidence={78} />
                <FreshnessBadge updatedAt="2026-07-17T18:00:00-05:00" />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                La plataforma explica el riesgo de acceso y transporte. Nunca etiqueta al productor como riesgoso.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="actors-heading" className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 id="actors-heading" className="sr-only">Actores conectados por Conecta</h2>
          <div className="grid md:grid-cols-3 md:divide-x md:divide-border">
            {ACTORS.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex gap-4 border-b border-border py-7 last:border-b-0 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0">
                <Icon className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-heading font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:py-28">
        <div className="lg:sticky lg:top-28">
          <p className="max-w-sm font-heading text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
            Negociar no debería ser una caja negra.
          </p>
          <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted-foreground">
            Conecta mantiene el precio editable y las decisiones en manos de quienes producen y compran.
          </p>
        </div>

        <div className="border-t border-border">
          <article className="grid gap-5 border-b border-border py-8 sm:grid-cols-[auto_1fr]">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
              <Zap className="size-5" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-heading text-2xl font-semibold tracking-[-0.02em]">Oferta rápida</h3>
                <span className="text-sm text-muted-foreground">Respuesta inmediata</span>
              </div>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
                El comprador propone un monto. Si cumple las condiciones privadas del productor, el producto se reserva durante 15 minutos. El mínimo nunca se revela.
              </p>
            </div>
          </article>
          <article className="grid gap-5 border-b border-border py-8 sm:grid-cols-[auto_1fr]">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
              <MessagesSquare className="size-5" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-heading text-2xl font-semibold tracking-[-0.02em]">Conversación estructurada</h3>
                <span className="text-sm text-muted-foreground">Para acuerdos complejos</span>
              </div>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
                Las partes conversan y comparan propuestas con cantidad, precio, calidad, fecha y logística. Solo una propuesta aceptada crea el acuerdo.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section id="marketplace-preview" className="scroll-mt-20 bg-secondary/45 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-3xl">
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">El marketplace, antes de registrarte</h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Explora la oferta activa del campo peruano, busca por producto o ubicación y revisa cada publicación antes de negociar.
            </p>
          </div>

          <div className="mt-9 overflow-hidden rounded-2xl border border-border bg-background shadow-[0_8px_24px_rgba(7,63,50,0.08)]">
            <div className="flex flex-col gap-4 border-b border-border bg-card px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-heading text-xl font-semibold tracking-[-0.02em]">Marketplace</p>
                <p className="mt-1 text-sm text-muted-foreground">Publicaciones conectadas y escenarios demo del campo peruano.</p>
              </div>
              <Button asChild className="h-10 w-fit px-4">
                <Link href="/marketplace">Abrir marketplace <ArrowRight className="size-4" /></Link>
              </Button>
            </div>

            <div className="p-4 sm:p-6">
              <form action="/marketplace" className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input name="q" placeholder="Buscar producto, variedad o ubicación" className="h-10 bg-card pl-9" />
                </div>
                <Button type="submit" className="h-10 px-5">Buscar</Button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtros del marketplace">
                <Button asChild size="sm"><Link href="/marketplace">Todas</Link></Button>
                <Button asChild size="sm" variant="outline"><Link href="/marketplace?type=offers">Ofertas</Link></Button>
                <Button asChild size="sm" variant="outline"><Link href="/marketplace?type=requests">Requerimientos</Link></Button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((listing) => (
                  <ProductCard
                    key={listing.id}
                    listing={listing}
                    canSave={false}
                    imageSrc={getListingImage(listing)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 bg-forest py-20 text-white lg:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Una operación, de principio a fin</h2>
            <p className="mt-4 text-white/72">
              La plataforma conecta decisiones que hoy ocurren por separado.
            </p>
          </div>
          <ol className="mt-12 grid border-t border-white/20 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([number, title, detail]) => (
              <li key={number} className="border-b border-white/20 py-7 md:px-6 md:first:pl-0 lg:border-r lg:last:border-r-0">
                <span className="text-sm font-medium text-white/50">{number}</span>
                <h3 className="mt-8 font-heading text-xl font-semibold">{title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/68">{detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
        <div className="relative min-h-[28rem] overflow-hidden rounded-2xl">
          <Image
            src={img("truckHighway", 1200)}
            alt="Camión de carga recorriendo una carretera entre montañas"
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-carbon/80 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <p className="max-w-md font-heading text-2xl font-semibold">El transporte forma parte del acuerdo, no es un problema para después.</p>
          </div>
        </div>

        <div>
          <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Rutas con contexto operativo</h2>
          <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
            Cada corredor separa riesgo, confianza y vigencia para ayudar a elegir el vehículo, el momento y la alternativa adecuada.
          </p>
          <div className="mt-8 border-t border-border">
            {DEMO_ROUTES.map((route) => (
              <div key={`${route.from}-${route.to}`} className="flex items-center justify-between gap-4 border-b border-border py-5">
                <div>
                  <p className="font-medium">{route.from} <span className="text-muted-foreground">a</span> {route.to}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{route.status}</p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{route.km} km</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Escenarios y distancias preparados para la demostración del MVP.</p>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl md:grid-cols-[0.8fr_1.2fr]">
          <div className="relative min-h-80 md:min-h-[30rem]">
            <Image
              src={img("farmerPeru", 1000)}
              alt="Productor rural peruano en una parcela de cultivo"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center px-4 py-14 md:px-12 lg:px-16">
            <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">Testimonio de demostración</span>
            <blockquote className="mt-7 max-w-2xl text-balance font-heading text-2xl font-medium leading-snug tracking-[-0.02em] sm:text-3xl">
              “Ahora conozco el rango antes de negociar y entiendo por qué el transporte cuesta lo que cuesta.”
            </blockquote>
            <p className="mt-6 text-sm text-muted-foreground">Rosa M., productora de Mazocruz</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 lg:py-28">
        <div className="grid gap-8 rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 lg:grid-cols-[1fr_auto] lg:items-center lg:px-14 lg:py-14">
          <div>
            <ShieldCheck className="size-7" aria-hidden="true" />
            <h2 className="mt-5 max-w-2xl font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Menos incertidumbre. Mejores acuerdos.
            </h2>
            <p className="mt-3 max-w-xl text-primary-foreground/78">
              Explora oportunidades rurales y organiza toda la operación desde un solo lugar.
            </p>
          </div>
          <Button size="lg" variant="secondary" asChild className="h-12 w-fit px-6">
            <Link href="/register">Crear una cuenta <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 md:flex-row md:items-end md:justify-between md:px-8">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <BrandLogo size={30} />
              <span className="font-heading font-semibold">Conecta</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Abastecimiento rural, negociación comercial y logística integrada para el sur del Perú.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <Link href="/marketplace" className="hover:text-foreground">Marketplace</Link>
            <Link href="/plans" className="hover:text-foreground">Planes</Link>
            <Link href="/login" className="hover:text-foreground">Iniciar sesión</Link>
            <Link href="/register" className="hover:text-foreground">Crear cuenta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
