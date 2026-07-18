"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, ShoppingBasket, Truck, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/domain";

const CARDS: { role: UserRole; label: string; description: string; icon: typeof Sprout }[] = [
  { role: "productor", label: "Soy productor", description: "Publico productos del campo o crianza para vender.", icon: Sprout },
  { role: "comprador", label: "Soy comprador", description: "Busco productos para mi negocio o restaurante.", icon: ShoppingBasket },
  { role: "transportista", label: "Soy transportista", description: "Ofrezco transporte de carga entre zonas rurales.", icon: Truck },
  { role: "admin", label: "Represento una organización", description: "Cooperativa, acopiador o empresa que agrupa varios roles.", icon: Building2 },
];

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<UserRole[]>([]);

  function toggle(role: UserRole) {
    setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  function goToOnboarding() {
    const primary = selected[0] ?? "productor";
    const normalizedPrimary = primary === "admin" ? "productor" : primary;
    window.localStorage.setItem("conecta.activeRole", normalizedPrimary);
    window.localStorage.setItem("conecta.enabledRoles", JSON.stringify(selected.length ? selected : ["productor"]));
    router.push("/home");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 md:py-20">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">¿Cómo quieres usar Conecta?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Puedes seleccionar una o varias tarjetas. Un mismo usuario puede tener múltiples roles.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map(({ role, label, description, icon: Icon }) => {
          const active = selected.includes(role);
          return (
            <button
              key={role}
              type="button"
              onClick={() => toggle(role)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-2xl border p-6 text-left transition-colors",
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

      <Button size="lg" disabled={selected.length === 0} onClick={goToOnboarding} className="self-center px-10">
        Continuar
      </Button>
    </div>
  );
}
