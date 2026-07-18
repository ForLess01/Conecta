import Link from "next/link";
import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPlaceholder } from "@/components/maps/map-placeholder";
import { SaveListingButton } from "@/components/marketplace/save-listing-button";
import { StartConversationButton } from "@/components/negotiation/start-conversation-button";
import { getActiveListing } from "@/lib/server/marketplace/queries";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getActiveListing(id);
  if (!listing || listing.type !== "request") notFound();
  return (
    <div className="space-y-6">
      <DesktopTopBar title={listing.title} description={`Requerimiento de ${listing.actorName}`} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card><CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap gap-2">
              {listing.acceptsPartialOffers && <Badge variant="secondary">Acepta oferta parcial</Badge>}
              {listing.acceptsMultipleSuppliers && <Badge variant="secondary">Acepta múltiples productores</Badge>}
            </div>
            {listing.description && <p className="text-sm text-muted-foreground">{listing.description}</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Info label="Cantidad requerida" value={`${listing.quantity.toLocaleString("es-PE")} ${listing.unitSymbol}`} />
              <Info label="Producto" value={`${listing.productName}${listing.varietyName ? ` · ${listing.varietyName}` : ""}`} />
              <Info label="Cierre" value={listing.deadlineAt ? new Date(listing.deadlineAt).toLocaleDateString("es-PE") : "Sin fecha"} />
            </div>
          </CardContent></Card>
          <MapPlaceholder label="Destino aproximado" markers={[{ label: listing.locationLabel }]} />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card><CardContent className="space-y-3 pt-6">
            <p className="text-xs font-medium text-muted-foreground">Comprador</p>
            <p className="font-heading font-semibold">{listing.actorName}</p>
            <Button variant="outline" asChild className="w-full"><Link href={`/profiles/${listing.actorId}`}>Ver perfil</Link></Button>
          </CardContent></Card>
          <Card><CardContent className="space-y-2 pt-6">
            <StartConversationButton listingId={listing.id} label="Postular con propuesta" variant="default" />
            <StartConversationButton listingId={listing.id} label="Conversar" />
            <SaveListingButton listingId={listing.id} initialSaved={listing.saved} inline />
          </CardContent></Card>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted/60 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div>;
}
