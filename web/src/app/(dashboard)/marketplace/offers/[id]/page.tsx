"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, Share2, Zap, MessagesSquare, ChevronRight } from "lucide-react";
import { getProductById, PRODUCTS } from "@/lib/mock/products";
import { PRODUCERS } from "@/lib/mock/actors";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryIcon } from "@/components/brand/category-icons";
import { RiskBreakdown } from "@/components/risk/risk-breakdown";
import { PriceSuggestionBadge } from "@/components/marketplace/price-suggestion-badge";
import { NegotiationModeBadge } from "@/components/marketplace/negotiation-mode-badge";
import { VerificationBadge } from "@/components/marketplace/misc-badges";
import { MapPlaceholder } from "@/components/maps/map-placeholder";
import { ProductCard } from "@/components/marketplace/product-card";
import { QuickOfferDialog } from "@/components/negotiation/quick-offer-dialog";
import { formatQuantity } from "@/lib/format";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProductById(id);
  const [quickOfferOpen, setQuickOfferOpen] = useState(false);

  if (!product) notFound();

  const producer = PRODUCERS.find((p) => p.id === product.producerId);
  const similar = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

  return (
    <div className="space-y-6">
      <DesktopTopBar title={product.name} description={product.variety} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="flex h-56 items-center justify-center rounded-2xl bg-secondary">
            <CategoryIcon category={product.category} size={72} className="text-primary" />
          </div>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-heading text-xl font-semibold">{product.name}</h2>
                  <p className="text-sm text-muted-foreground">{product.variety}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Guardar">
                    <Bookmark className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Compartir">
                    <Share2 className="size-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{product.description}</p>
              <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                <InfoBlock label="Calidad" value={product.quality} />
                <InfoBlock label="Disponible" value={formatQuantity(product.quantityAvailable, product.unit)} />
                <InfoBlock label="Pedido mínimo" value={formatQuantity(product.minOrder, product.unit)} />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <NegotiationModeBadge mode={product.negotiationMode} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6">
              <h3 className="font-heading text-base font-semibold">Rango sugerido de precio</h3>
              <PriceSuggestionBadge range={product.priceRange} />
              <div className="grid gap-2 sm:grid-cols-2">
                {product.priceRange.basis.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Este rango es orientativo: nunca es un precio obligatorio ni bloquea ofertas fuera del rango.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-semibold">Riesgo de acceso y transporte</h3>
              <Link href={`/risk/${product.id}`} className="flex items-center text-xs text-primary hover:underline">
                Ver riesgo completo <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <RiskBreakdown risk={product.risk} />
          </div>

          {similar.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading text-base font-semibold">Productos similares</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <p className="text-xs font-medium text-muted-foreground">Productor</p>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                  {producer?.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{producer?.name}</p>
                  {producer && <VerificationBadge level={producer.verification} />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Responde en un promedio de {producer?.responseTimeHours} h · {producer?.operationsCompleted} operaciones completadas
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={`/profiles/${producer?.id}`}>Ver perfil del productor</Link>
              </Button>
            </CardContent>
          </Card>

          <MapPlaceholder label="Ubicación aproximada" markers={[{ label: `${product.location.district}, ${product.location.region}` }]} />

          <Card>
            <CardContent className="space-y-2 pt-6">
              {product.quickOfferEnabled && (
                <Button size="lg" className="w-full gap-2" onClick={() => setQuickOfferOpen(true)}>
                  <Zap className="size-4" /> Oferta rápida
                </Button>
              )}
              {product.conversationalEnabled && (
                <Button size="lg" variant="outline" className="w-full gap-2" asChild>
                  <Link href="/negotiations/neg-1">
                    <MessagesSquare className="size-4" /> Conversar y negociar
                  </Link>
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground">
                Ventana de negociación: {product.negotiationWindowHours} h
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <QuickOfferDialog product={product} open={quickOfferOpen} onOpenChange={setQuickOfferOpen} />
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
