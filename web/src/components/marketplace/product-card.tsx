import Image from "next/image";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocationBadge, QuantityBadge } from "./misc-badges";
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
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-secondary/70 text-primary">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${listing.productName}${listing.varietyName ? `, ${listing.varietyName}` : ""}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <PackageOpen className="size-12" aria-hidden="true" />
        )}
        {imageSrc && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />}
        <Badge className="absolute left-3 top-3" variant="secondary">Oferta</Badge>
        {canSave && <SaveListingButton listingId={listing.id} initialSaved={listing.saved} />}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="font-heading text-sm font-semibold leading-tight">{listing.title}</h2>
          <p className="text-xs text-muted-foreground">{listing.productName}{listing.varietyName ? ` · ${listing.varietyName}` : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocationBadge label={listing.locationLabel} />
          <QuantityBadge label={`${listing.quantity.toLocaleString("es-PE")} ${listing.unitSymbol}`} />
        </div>
        {listing.description && <p className="line-clamp-2 text-xs text-muted-foreground">{listing.description}</p>}
        <div className="mt-auto border-t border-border pt-3">
          <Link href={`/profiles/${listing.actorId}`} className="text-xs font-medium hover:text-primary hover:underline">
            {listing.actorName}
          </Link>
        </div>
        <Button asChild className="w-full">
          <Link href={`/marketplace/offers/${listing.id}`}>Abrir producto</Link>
        </Button>
      </div>
    </article>
  );
}
