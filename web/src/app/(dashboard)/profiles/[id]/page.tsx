"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PRODUCERS, BUYERS, TRANSPORTERS } from "@/lib/mock/actors";
import { PRODUCTS } from "@/lib/mock/products";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/marketplace/misc-badges";
import { VEHICLE_LABELS } from "@/lib/mock/vehicle-labels";
import { avatarUrl } from "@/lib/avatars";

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const producer = PRODUCERS.find((p) => p.id === id);
  const buyer = BUYERS.find((b) => b.id === id);
  const transporter = TRANSPORTERS.find((t) => t.id === id);

  if (!producer && !buyer && !transporter) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DesktopTopBar
        title={producer?.name ?? buyer?.name ?? transporter?.name ?? ""}
        description={producer ? "Perfil de productor" : buyer ? "Perfil de comprador" : "Perfil de transportista"}
      />

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          {avatarUrl(id) ? (
            <Image
              src={avatarUrl(id)!}
              alt={`Fotografía de ${(producer ?? buyer ?? transporter)?.name}`}
              width={64}
              height={64}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-lg font-semibold text-secondary-foreground">
              {(producer ?? buyer ?? transporter)?.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-heading text-lg font-semibold">{producer?.name ?? buyer?.name ?? transporter?.name}</p>
            <VerificationBadge level={(producer ?? buyer ?? transporter)!.verification} />
          </div>
        </CardContent>
      </Card>

      {producer && (
        <>
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <Info label="Ubicación aproximada" value={`${producer.location.district}, ${producer.location.region}`} />
              <Info label="Tiempo de respuesta" value={`${producer.responseTimeHours} h en promedio`} />
              <Info label="Operaciones completadas" value={String(producer.operationsCompleted)} />
              <Info label="Miembro desde" value={new Date(producer.memberSince).toLocaleDateString("es-PE")} />
            </CardContent>
          </Card>
          <div className="space-y-3">
            <h3 className="font-heading text-base font-semibold">Productos activos</h3>
            {PRODUCTS.filter((p) => p.producerId === producer.id).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <span className="text-sm font-medium">{p.name}</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/marketplace/offers/${p.id}`}>Ver producto</Link>
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {buyer && (
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <Info label="Organización" value={buyer.organization ?? "—"} />
            <Info label="Frecuencia de compra" value={buyer.purchaseFrequency} />
            <Info label="Ubicación" value={`${buyer.location.district}, ${buyer.location.region}`} />
          </CardContent>
        </Card>
      )}

      {transporter && (
        <>
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <Info label="Tipo" value={transporter.isCompany ? "Empresa" : "Independiente"} />
              <Info label="Cumplimiento" value={`${transporter.complianceRate}%`} />
              <Info label="Operaciones completadas" value={String(transporter.operationsCompleted)} />
              <Info label="Seguro declarado" value={transporter.insuranceDeclared ? "Sí" : "No"} />
              <Info label="Rutas frecuentes" value={transporter.frequentRoutes.join(", ")} />
            </CardContent>
          </Card>
          <div className="space-y-3">
            <h3 className="font-heading text-base font-semibold">Flota</h3>
            {transporter.vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <span className="text-sm font-medium">{VEHICLE_LABELS[v.type]} — {v.plate}</span>
                <span className="text-xs text-muted-foreground">{v.capacityKg.toLocaleString("es-PE")} kg</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Button className="w-full sm:w-auto">Conversar</Button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
