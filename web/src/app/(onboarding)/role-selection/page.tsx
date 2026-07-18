"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, ShoppingBasket, Truck, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SelfServiceRole } from "@/lib/roles";

const CARDS: { role: SelfServiceRole; label: string; description: string; icon: typeof Sprout }[] = [
  { role: "productor", label: "Soy productor", description: "Publico productos del campo o crianza para vender.", icon: Sprout },
  { role: "comprador", label: "Soy comprador", description: "Busco productos para mi negocio o restaurante.", icon: ShoppingBasket },
  { role: "transportista", label: "Soy transportista", description: "Ofrezco transporte de carga entre zonas rurales.", icon: Truck },
];

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<SelfServiceRole[]>([]);
  const [profileType, setProfileType] = useState<"person" | "organization">("person");

  function toggle(role: SelfServiceRole) {
    setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  function goToOnboarding() {
    const primary = selected[0] ?? "productor";
    window.localStorage.setItem("conecta.activeRole", primary);
    window.localStorage.setItem("conecta.enabledRoles", JSON.stringify(selected.length ? selected : ["productor"]));
    window.localStorage.setItem("conecta.profileType", profileType);
    const ONBOARDING_ROUTE: Record<string, string> = {
      productor: "/producer",
      comprador: "/buyer",
      transportista: "/transporter",
    };
    router.push(ONBOARDING_ROUTE[primary] ?? "/producer");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 md:py-20">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">¿Cómo quieres usar Conecta?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Puedes seleccionar una o varias tarjetas. Un mismo usuario puede tener múltiples roles.
        </p>
      </div>

      <section aria-labelledby="profile-type-heading" className="space-y-3">
        <div>
          <h2 id="profile-type-heading" className="font-heading text-lg font-semibold">Tipo de perfil</h2>
          <p className="text-sm text-muted-foreground">El tipo de cuenta no cambia tus permisos ni crea un rol administrativo.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={profileType === "person"}
            onClick={() => setProfileType("person")}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              profileType === "person" ? "border-primary bg-secondary" : "border-border bg-card hover:bg-muted"
            )}
          >
            <Sprout className="size-5 text-primary" aria-hidden="true" />
            <span><span className="block font-medium">Persona</span><span className="text-xs text-muted-foreground">Trabajo a título personal.</span></span>
          </button>
          <button
            type="button"
            aria-pressed={profileType === "organization"}
            onClick={() => setProfileType("organization")}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              profileType === "organization" ? "border-primary bg-secondary" : "border-border bg-card hover:bg-muted"
            )}
          >
            <Building2 className="size-5 text-primary" aria-hidden="true" />
            <span><span className="block font-medium">Organización</span><span className="text-xs text-muted-foreground">Cooperativa, empresa o asociación.</span></span>
          </button>
        </div>
      </section>

      <section aria-labelledby="roles-heading" className="space-y-3">
        <div>
          <h2 id="roles-heading" className="font-heading text-lg font-semibold">Roles de trabajo</h2>
          <p className="text-sm text-muted-foreground">Selecciona uno o varios roles operativos.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map(({ role, label, description, icon: Icon }) => {
          const active = selected.includes(role);
          return (
            <button
              key={role}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(role)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                active ? "border-primary bg-secondary" : "border-border bg-card hover:bg-muted"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-full bg-card text-primary">
                  <Icon className="size-5" />
                </span>
                {active && (
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" />
                  </span>
                )}
              </div>
              <div>
                <p className="font-heading font-semibold">{label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </button>
          );
        })}
        </div>
      </section>

      <Button size="lg" disabled={selected.length === 0} onClick={goToOnboarding} className="self-center px-10">
        Continuar
      </Button>
    </div>
  );
}
