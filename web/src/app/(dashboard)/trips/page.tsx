"use client";

import Link from "next/link";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { TRIPS } from "@/lib/mock/logistics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Route } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  programado: "Programado",
  recojo: "Recojo",
  en_transito: "En tránsito",
  demorado: "Demorado",
  entregado: "Entregado",
};

export default function TripsListPage() {
  return (
    <div className="space-y-6">
      <DesktopTopBar title="Viajes" description="Viajes programados y en curso." />
      {TRIPS.length === 0 ? (
        <EmptyState icon={Route} title="Sin viajes programados" description="Cuando se asigne un flete, tus viajes aparecerán aquí." />
      ) : (
        <div className="space-y-3">
          {TRIPS.map((trip) => (
            <Card key={trip.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-medium">{trip.cargoDescription}</p>
                  <Badge variant="secondary" className="mt-1">{STATUS_LABEL[trip.status]}</Badge>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/trips/${trip.id}`}>Seguimiento</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
