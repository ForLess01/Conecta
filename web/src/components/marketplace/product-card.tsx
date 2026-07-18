import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { Product } from "@/types/domain";
import { PRODUCERS } from "@/lib/mock/actors";
import { CategoryIcon } from "@/components/brand/category-icons";
import { RiskBadge } from "./risk-badge";
import { ConfidenceBadge, FreshnessBadge } from "./confidence-badge";
import { PriceSuggestionBadge } from "./price-suggestion-badge";
import { NegotiationModeBadge } from "./negotiation-mode-badge";
import { VerificationBadge, LocationBadge, QuantityBadge } from "./misc-badges";
import { formatQuantity } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function ProductCard({ product }: { product: Product }) {
  const producer = PRODUCERS.find((p) => p.id === product.producerId);

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative flex h-32 items-center justify-center bg-secondary">
        <CategoryIcon category={product.category} size={40} className="text-primary" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 size-8 bg-card/80 backdrop-blur hover:bg-card"
          aria-label="Guardar producto"
        >
          <Bookmark className="size-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-heading text-sm font-semibold leading-tight">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.variety}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LocationBadge label={`${product.location.district}, ${product.location.region}`} />
          <QuantityBadge label={formatQuantity(product.quantityAvailable, product.unit)} />
        </div>

        <PriceSuggestionBadge range={product.priceRange} compact />

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <NegotiationModeBadge mode={product.negotiationMode} />
          <RiskBadge level={product.risk.level} score={product.risk.score} />
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceBadge confidence={product.risk.confidence} />
          <FreshnessBadge updatedAt={product.risk.updatedAt} />
        </div>

        <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-medium truncate">{producer?.name}</span>
            {producer && <VerificationBadge level={producer.verification} />}
          </div>
        </div>

        <Button asChild className="mt-1 w-full">
          <Link href={`/marketplace/offers/${product.id}`}>Abrir producto</Link>
        </Button>
      </div>
    </div>
  );
}
