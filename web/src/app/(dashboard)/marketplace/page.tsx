import Link from "next/link";
import { Search, ShoppingBasket } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/marketplace/product-card";
import { RequestCard } from "@/components/marketplace/request-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getActiveListings } from "@/lib/server/marketplace/queries";

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const params = await searchParams;
  const type = params.type === "offers" ? "OFFER" : params.type === "requests" ? "REQUEST" : undefined;
  const listings = await getActiveListings({ query: params.q, type });

  return (
    <div className="space-y-5">
      <DesktopTopBar title="Marketplace" description="Explora ofertas y requerimientos activos del campo peruano." />
      <form action="/marketplace" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={params.q} placeholder="Buscar producto, variedad o ubicación…" className="pl-9" />
        </div>
        {params.type && <input type="hidden" name="type" value={params.type} />}
        <Button type="submit">Buscar</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <FilterLink href="/marketplace" active={!type}>Todas</FilterLink>
        <FilterLink href="/marketplace?type=offers" active={type === "OFFER"}>Ofertas</FilterLink>
        <FilterLink href="/marketplace?type=requests" active={type === "REQUEST"}>Requerimientos</FilterLink>
      </div>
      {listings.length === 0 ? (
        <EmptyState icon={ShoppingBasket} title="No encontramos publicaciones" description="Probá con otra búsqueda o quitá los filtros." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => listing.type === "offer"
            ? <ProductCard key={listing.id} listing={listing} />
            : <RequestCard key={listing.id} listing={listing} />)}
        </div>
      )}
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Button asChild size="sm" variant={active ? "default" : "outline"}><Link href={href}>{children}</Link></Button>;
}
