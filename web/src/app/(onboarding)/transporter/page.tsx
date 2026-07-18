"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stepper } from "@/components/shared/stepper";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { completeOnboardingAction } from "../actions";

const STEPS = ["Identidad", "Operación", "Vehículo", "Capacidad", "Rutas", "Documentos", "Retorno"];

export default function TransporterOnboardingPage() {
  const [step, setStep] = useState(0);
  const [operationType, setOperationType] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("camion_8t");
  const [plate, setPlate] = useState("");
  const [bodyType, setBodyType] = useState("baranda");
  const [capacityKg, setCapacityKg] = useState("");
  const [capacityM3, setCapacityM3] = useState("");
  const [routes, setRoutes] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [returnAvailable, setReturnAvailable] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Configura tu perfil de transportista</h1>
        <p className="mt-1 text-sm text-muted-foreground">Completa los 7 pasos para empezar a recibir cargas.</p>
      </div>
      <Stepper steps={STEPS} currentStep={step} />

      <Card>
        <CardContent className="space-y-4 pt-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre completo</Label>
                 <Input id="name" placeholder="Nombre y apellidos" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                 <Input id="phone" placeholder="9XX XXX XXX" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {["Independiente", "Empresa de transporte"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOperationType(type)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                    operationType === type ? "border-primary bg-secondary" : "border-border bg-card hover:bg-muted"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tipo de vehículo</Label>
                 <Select value={vehicleType} onValueChange={(value) => value && setVehicleType(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="camioneta_4x4">Camioneta 4x4</SelectItem>
                    <SelectItem value="camion_ligero">Camión ligero</SelectItem>
                    <SelectItem value="camion_8t">Camión 8 t</SelectItem>
                    <SelectItem value="camion_12t">Camión 12 t</SelectItem>
                    <SelectItem value="furgon_cubierto">Furgón cubierto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plate">Placa</Label>
                 <Input id="plate" placeholder="XXX-000" value={plate} onChange={(event) => setPlate(event.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Carrocería</Label>
                 <Select value={bodyType} onValueChange={(value) => value && setBodyType(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baranda">Baranda</SelectItem>
                    <SelectItem value="furgon">Furgón cerrado</SelectItem>
                    <SelectItem value="refrigerado">Refrigerado</SelectItem>
                    <SelectItem value="plataforma">Plataforma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="kg">Capacidad (kg)</Label>
                 <Input id="kg" type="number" placeholder="8000" value={capacityKg} onChange={(event) => setCapacityKg(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m3">Capacidad (m3)</Label>
                 <Input id="m3" type="number" placeholder="22" value={capacityM3} onChange={(event) => setCapacityM3(event.target.value)} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Label>Rutas frecuentes</Label>
              {["Ilave - Juliaca", "Acora - Puno", "Puno - Arequipa", "Juli - Puno"].map((route) => (
                <label key={route} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm">
                   <Checkbox checked={routes.includes(route)} onCheckedChange={() => setRoutes((current) => current.includes(route) ? current.filter((item) => item !== route) : [...current, route])} /> {route}
                </label>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Declara tus documentos. Los verificaremos para subir tu nivel de confianza.</p>
              {["Licencia de conducir", "SOAT vigente", "Revisión técnica", "Tarjeta de propiedad"].map((doc) => (
                <label key={doc} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm">
                   <Checkbox checked={documents.includes(doc)} onCheckedChange={() => setDocuments((current) => current.includes(doc) ? current.filter((item) => item !== doc) : [...current, doc])} /> {doc}
                </label>
              ))}
            </div>
          )}

          {step === 6 && (
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">Disponible para carga de retorno</p>
                <p className="text-xs text-muted-foreground">Recibe sugerencias de carga para tu viaje de vuelta y evita retornar vacío.</p>
              </div>
               <Switch checked={returnAvailable} onCheckedChange={setReturnAvailable} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Atrás
          </Button>
        </div>
        {isLast ? (
          <Button
             disabled={isPending}
             onClick={() => startTransition(async () => {
               try {
                 const vehicleTypeCode = ({ pickup: "PICKUP", camioneta_4x4: "PICKUP", camion_ligero: "LIGHT_TRUCK", camion_8t: "MEDIUM_TRUCK", camion_12t: "HEAVY_TRUCK", furgon_cubierto: "VAN" } as const)[vehicleType as "pickup" | "camioneta_4x4" | "camion_ligero" | "camion_8t" | "camion_12t" | "furgon_cubierto"];
                  const bodyTypeCode = ({ baranda: "OPEN", furgon: "COVERED", refrigerado: "REFRIGERATED", plataforma: "OPEN" } as const)[bodyType as "baranda" | "furgon" | "refrigerado" | "plataforma"];
                 await completeOnboardingAction({
                   role: "transportista", name, phone,
                   details: { operationType, routes, declaredDocuments: documents, returnAvailable },
                   vehicle: plate ? { plate, vehicleTypeCode, bodyTypeCode, capacityKg: Number(capacityKg), capacityM3, covered: bodyType !== "plataforma", refrigerated: bodyType === "refrigerado", fourWheelDrive: vehicleType === "camioneta_4x4" } : null,
                 });
                 toast.success("Perfil de transportista configurado.");
                 router.push("/verification");
               } catch (error) {
                 toast.error(error instanceof Error ? error.message : "No se pudo guardar el perfil.");
               }
             })}
          >
             {isPending ? "Guardando..." : "Finalizar"}
          </Button>
        ) : (
          <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Siguiente</Button>
        )}
      </div>
    </div>
  );
}
