import Image from "next/image";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge, FreshnessBadge } from "./confidence-badge";
import { LocationBadge, QuantityBadge, VerificationBadge } from "./misc-badges";
import { NegotiationModeBadge } from "./negotiation-mode-badge";
import { PriceSuggestionBadge } from "./price-suggestion-badge";
import { RiskBadge } from "./risk-badge";
import { SaveListingButton } from "./save-listing-button";
import type { MarketplaceListing } from "@/lib/server/marketplace/types";

export function ProductCard({
  listing,
  canSave = true,
  imageSrc,
}: {
  listing: MarketplaceListing;
  canSave?: boolean;
  imageSrc?: string;
}) {
  const productImage = imageSrc ?? listing.imageUrl;

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
      <Link
        href={`/marketplace/offers/${listing.id}`}
        aria-label={`Abrir ${listing.title}`}
        className="flex h-full flex-col outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-secondary/70 text-primary">
        {productImage ? (
          <Image
            src={productImage}
            alt={`${listing.productName}${listing.varietyName ? `, ${listing.varietyName}` : ""}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectPosition: listing.imagePosition }}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <PackageOpen className="size-12" aria-hidden="true" />
        )}
          {productImage && <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />}
          <Badge className="absolute left-3 top-3 bg-card/95 text-card-foreground backdrop-blur-sm" variant="secondary">
            {listing.productName}
          </Badge>
          {listing.risk && (
            <RiskBadge
              level={listing.risk.level}
              score={listing.risk.score}
              showScore={false}
              className="absolute right-3 top-3 bg-card/95 backdrop-blur-sm"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div>
            <h2 className="font-heading text-lg font-semibold leading-tight tracking-[-0.02em]">{listing.title}</h2>
            {listing.varietyName && <p className="mt-1 text-sm text-muted-foreground">{listing.varietyName}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <LocationBadge label={listing.locationLabel} />
            <QuantityBadge label={`${listing.quantity.toLocaleString("es-PE")} ${listing.unitSymbol} disponibles`} />
          </div>

          {listing.priceRange && (
            <div className="rounded-xl bg-secondary/70 px-4 py-3">
              <PriceSuggestionBadge range={listing.priceRange} compact />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <NegotiationModeBadge mode={listing.negotiationMode} />
            {listing.priceRange && <ConfidenceBadge confidence={listing.priceRange.confidence} />}
          </div>

          <div className="mt-auto border-t border-border pt-3">
            <p className="truncate text-sm font-medium">{listing.actorName}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <VerificationBadge level={listing.actorVerification} />
              <FreshnessBadge updatedAt={listing.priceRange?.updatedAt ?? listing.createdAt} />
            </div>
          </div>
        </div>
      </Link>
      {canSave && (
        <SaveListingButton
          listingId={listing.id}
          initialSaved={listing.saved}
          className="top-[8.75rem] z-10 bg-card/95 backdrop-blur-sm"
        />
      )}
    </article>
  );
}
