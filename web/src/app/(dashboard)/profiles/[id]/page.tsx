import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/marketplace/product-card";
import { RequestCard } from "@/components/marketplace/request-card";
import { SaveActorButton } from "@/components/marketplace/save-actor-button";
import { getPublicActorProfile } from "@/lib/server/profiles/queries";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, saved, listings } = await getPublicActorProfile(id);
  if (!profile) notFound();
  const roleLabels: Record<string, string> = { PRODUCER: "Productor", BUYER: "Comprador", TRANSPORTER: "Transportista" };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <DesktopTopBar title={profile.name} description={profile.roles.map((role) => roleLabels[role] ?? role).join(" · ")} />
      <Card><CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-lg font-semibold text-secondary-foreground">{profile.name.slice(0, 2).toUpperCase()}</div>
          <div><p className="font-heading text-lg font-semibold">{profile.name}</p><p className="text-xs text-primary">{profile.verificationName}</p></div>
        </div>
        <SaveActorButton actorId={profile.id} initialSaved={saved} />
      </CardContent></Card>
      <Card><CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
        <Info label="Tipo de cuenta" value={profile.kind === "ORGANIZATION" ? "Organización" : "Persona"} />
        <Info label="Miembro desde" value={new Date(profile.memberSince).toLocaleDateString("es-PE")} />
        <Info label="Ubicación pública" value={profile.locations.map((location) => location.label).join(", ") || "No informada"} />
        <Info label="Verificación" value={profile.verificationName} />
      </CardContent></Card>
      {listings.length > 0 && <section className="space-y-3"><h2 className="font-heading text-base font-semibold">Publicaciones activas</h2><div className="grid gap-4 sm:grid-cols-2">{listings.map((listing) => listing.type === "offer" ? <ProductCard key={listing.id} listing={listing} /> : <RequestCard key={listing.id} listing={listing} />)}</div></section>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div>;
}
