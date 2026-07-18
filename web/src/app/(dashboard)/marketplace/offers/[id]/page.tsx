import Link from "next/link";
import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPlaceholder } from "@/components/maps/map-placeholder";
import { SaveListingButton } from "@/components/marketplace/save-listing-button";
import { QuickOfferButton } from "@/components/marketplace/quick-offer-button";
import { StartConversationButton } from "@/components/negotiation/start-conversation-button";
import { getActiveListing } from "@/lib/server/marketplace/queries";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getActiveListing(id);
  if (!listing || listing.type !== "offer") notFound();

  return (
    <div className="space-y-6">
      <DesktopTopBar title={listing.title} description={`${listing.productName}${listing.varietyName ? ` · ${listing.varietyName}` : ""}`} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card><CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Oferta activa</Badge>
              {listing.allowPartialQuantity && <Badge variant="outline">Acepta cantidad parcial</Badge>}
            </div>
            {listing.description && <p className="text-sm text-muted-foreground">{listing.description}</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Info label="Disponible" value={`${listing.quantity.toLocaleString("es-PE")} ${listing.unitSymbol}`} />
              <Info label="Pedido mínimo" value={listing.minimumOrderQuantity ? `${listing.minimumOrderQuantity.toLocaleString("es-PE")} ${listing.unitSymbol}` : "A convenir"} />
              <Info label="Disponible desde" value={listing.availableFrom ? new Date(`${listing.availableFrom}T12:00:00`).toLocaleDateString("es-PE") : "Ahora"} />
            </div>
          </CardContent></Card>
          <MapPlaceholder label="Ubicación aproximada" markers={[{ label: listing.locationLabel }]} />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card><CardContent className="space-y-3 pt-6">
            <p className="text-xs font-medium text-muted-foreground">Publicado por</p>
            <p className="font-heading font-semibold">{listing.actorName}</p>
            <Button variant="outline" asChild className="w-full"><Link href={`/profiles/${listing.actorId}`}>Ver perfil</Link></Button>
          </CardContent></Card>
          <Card><CardContent className="space-y-2 pt-6">
            {listing.quickNegotiationEnabled && <QuickOfferButton listingId={listing.id} productName={listing.productName} unitSymbol={listing.unitSymbol} minimumQuantity={listing.minimumOrderQuantity ?? 1} maximumQuantity={listing.quantity} />}
            <StartConversationButton listingId={listing.id} />
            <SaveListingButton listingId={listing.id} initialSaved={listing.saved} inline />
            <p className="text-center text-xs text-muted-foreground">Ventana de negociación: {listing.conversationalWindowHours} h</p>
          </CardContent></Card>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted/60 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div>;
}
