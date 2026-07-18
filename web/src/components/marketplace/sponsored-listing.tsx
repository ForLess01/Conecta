import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function SponsoredListing() {
  return (
    <aside className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <Badge variant="secondary">Patrocinado</Badge>
        <p className="font-heading font-semibold">Cooperativa Agroecológica del Collao</p>
        <p className="text-sm text-muted-foreground">Quinua certificada con entrega coordinada desde Juli. Publicación identificada y separada del orden orgánico.</p>
      </div>
      <Button asChild variant="outline" className="shrink-0"><Link href="/marketplace/offers/prod-quinua">Conocer oferta</Link></Button>
    </aside>
  );
}
