import Link from "next/link";
import { Bookmark } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/marketplace/product-card";
import { RequestCard } from "@/components/marketplace/request-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSavedData } from "@/lib/server/saved/queries";

export default async function SavedPage() {
  const { listings, actors } = await getSavedData();
  const offers = listings.filter((listing) => listing.type === "offer");
  const requests = listings.filter((listing) => listing.type === "request");
  return (
    <div className="space-y-6">
      <DesktopTopBar title="Favoritos y guardados" description="Publicaciones y perfiles que querés seguir de cerca." />
      <Tabs defaultValue="ofertas">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ofertas">Ofertas ({offers.length})</TabsTrigger>
          <TabsTrigger value="requerimientos">Requerimientos ({requests.length})</TabsTrigger>
          <TabsTrigger value="perfiles">Perfiles ({actors.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="ofertas" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.length ? offers.map((listing) => <ProductCard key={listing.id} listing={listing} />) : <EmptyState icon={Bookmark} title="Sin ofertas guardadas" />}
        </TabsContent>
        <TabsContent value="requerimientos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requests.length ? requests.map((listing) => <RequestCard key={listing.id} listing={listing} />) : <EmptyState icon={Bookmark} title="Sin requerimientos guardados" />}
        </TabsContent>
        <TabsContent value="perfiles" className="grid gap-3 sm:grid-cols-2">
          {actors.length ? actors.map((actor) => <Card key={actor.id}><CardContent className="flex items-center justify-between gap-3 pt-6"><div><p className="font-heading font-semibold">{actor.display_name}</p><p className="text-xs text-muted-foreground">{actor.kind === "ORGANIZATION" ? "Organización" : "Persona"}</p></div><Button asChild variant="outline" size="sm"><Link href={`/profiles/${actor.id}`}>Ver perfil</Link></Button></CardContent></Card>) : <EmptyState icon={Bookmark} title="Sin perfiles guardados" />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
