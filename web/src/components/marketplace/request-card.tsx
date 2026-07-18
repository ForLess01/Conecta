import Link from "next/link";
import { CalendarClock, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocationBadge, QuantityBadge } from "./misc-badges";
import { SaveListingButton } from "./save-listing-button";
import type { MarketplaceListing } from "@/lib/server/marketplace/types";

export function RequestCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <ClipboardList className="size-5" />
        </div>
        <Badge variant="outline">Requerimiento</Badge>
      </div>
      <div>
        <h2 className="font-heading text-sm font-semibold">{listing.title}</h2>
        <p className="text-xs text-muted-foreground">{listing.productName}{listing.varietyName ? ` · ${listing.varietyName}` : ""}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <LocationBadge label={listing.locationLabel} />
        <QuantityBadge label={`${listing.quantity.toLocaleString("es-PE")} ${listing.unitSymbol}`} />
      </div>
      {listing.deadlineAt && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" /> Hasta {new Date(listing.deadlineAt).toLocaleDateString("es-PE")}
        </p>
      )}
      <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
        <Button asChild className="flex-1">
          <Link href={`/marketplace/requests/${listing.id}`}>Ver requerimiento</Link>
        </Button>
        <SaveListingButton listingId={listing.id} initialSaved={listing.saved} inline />
      </div>
    </article>
  );
}
