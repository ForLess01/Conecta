"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Truck, Home, Search } from "lucide-react";
import { getOrderById } from "@/lib/mock/orders";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LogisticsMode } from "@/types/domain";

const OPTIONS: {
  mode: LogisticsMode;
  icon: typeof Truck;
  title: string;
  description: string;
  cost: string;
  responsible: string;
}[] = [
  {
    mode: "recoge_comprador",
    icon: Home,
    title: "Recoge el comprador",
    description: "Tú organizas el transporte con vehículo propio. Coordina directamente con el productor.",
    cost: "Costo cero en la plataforma",
    responsible: "Responsabilidad del comprador",
  },
  {
    mode: "entrega_productor",
    icon: Truck,
    title: "Entrega el productor",
    description: "El productor entrega con su propio vehículo, con fecha estimada y precio que incluye el flete.",
    cost: "Precio con entrega incluida",
    responsible: "Vehículo del productor",
  },
  {
    mode: "marketplace_flete",
    icon: Search,
    title: "Buscar transporte",
    description: "Publica una solicitud en el marketplace de cargas y compara ofertas de transportistas.",
    cost: "Tarifa sugerida, ofertas de transportistas",
    responsible: "Transportista seleccionado por ti",
  },
];

export default function LogisticsModeSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = getOrderById(id);
  const router = useRouter();
  const [selected, setSelected] = useState<LogisticsMode | null>(null);

  if (!order) notFound();

  function goNext() {
    if (selected === "marketplace_flete") {
      router.push("/transport/new");
    } else {
      router.push(`/orders/${id}`);
    }
  }

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Selecciona la modalidad logística" description={`Orden ${order.id.toUpperCase()}`} />

      <div className="grid gap-4 md:grid-cols-3">
        {OPTIONS.map(({ mode, icon: Icon, title, description, cost, responsible }) => {
          const active = selected === mode;
          return (
            <button
              key={mode}
              onClick={() => setSelected(mode)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-2xl border p-6 text-left transition-colors",
                active ? "border-primary bg-secondary" : "border-border bg-card hover:bg-muted"
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-card text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-heading font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
              <div className="mt-auto w-full space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                <p>{cost}</p>
                <p>{responsible}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" asChild>
          <Link href={`/orders/${id}`}>Cancelar</Link>
        </Button>
        <Button disabled={!selected} onClick={goNext}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
