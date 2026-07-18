"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, Map as MapIcon, Search } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/marketplace/product-card";
import { MapPlaceholder } from "@/components/maps/map-placeholder";
import { EmptyState } from "@/components/shared/empty-state";
import { PRODUCTS } from "@/lib/mock/products";
import { RISK_EVENTS } from "@/lib/mock/risk";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/types/domain";
import { CategoryIcon } from "@/components/brand/category-icons";
import { ShoppingBasket } from "lucide-react";
import { SponsoredListing } from "@/components/marketplace/sponsored-listing";

const CATEGORIES: { value: ProductCategory | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "papa", label: "Papa" },
  { value: "quinua", label: "Quinua" },
  { value: "fibra_alpaca", label: "Fibra de alpaca" },
  { value: "cebolla", label: "Cebolla" },
  { value: "trucha", label: "Trucha" },
];

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [category, setCategory] = useState<ProductCategory | "todas">("todas");
  const [view, setView] = useState<"grid" | "map">("grid");

  const results = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesCategory = category === "todas" || p.category === category;
      const matchesQuery =
        query.trim() === "" ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.variety.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div className="space-y-5">
      <DesktopTopBar title="Marketplace" description="Explora productos disponibles con rango sugerido y riesgo de acceso." />

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              aria-label="Buscar productos"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar papa, quinua, fibra de alpaca…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            <Button
              size="sm"
              variant={view === "grid" ? "default" : "ghost"}
              onClick={() => setView("grid")}
              className="gap-1.5"
            >
              <LayoutGrid className="size-4" /> Cuadrícula
            </Button>
            <Button
              size="sm"
              variant={view === "map" ? "default" : "ghost"}
              onClick={() => setView("map")}
              className="gap-1.5"
            >
              <MapIcon className="size-4" /> Mapa
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                category === cat.value
                  ? "border-primary bg-secondary text-secondary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {cat.value !== "todas" && <CategoryIcon category={cat.value} size={14} />}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <SponsoredListing />

      {results.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="No encontramos productos"
          description="Ajusta tu búsqueda o quita filtros de categoría."
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <MapPlaceholder
            className="lg:sticky lg:top-20 lg:min-h-[32rem]"
            label="Vista de mapa con clusters y eventos de riesgo"
            markers={[
              ...results.map((p) => ({ label: p.location.district, risk: p.risk.level })),
              ...RISK_EVENTS.map((e) => ({ label: `Evento: ${e.type}`, risk: undefined })),
            ]}
          />
        </div>
      )}
    </div>
  );
}
