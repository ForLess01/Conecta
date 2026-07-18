import Link from "next/link";
import { Truck } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listMyVehicles } from "@/lib/server/vehicles";
import { saveVehicleAction } from "./actions";

const TYPES = [["MOTORCYCLE", "Motocarga"], ["PICKUP", "Pickup"], ["VAN", "Furgón"], ["LIGHT_TRUCK", "Camión ligero"], ["MEDIUM_TRUCK", "Camión mediano"], ["HEAVY_TRUCK", "Camión pesado"]];

export default async function VehiclesPage() {
  const vehicles = await listMyVehicles();
  const available = vehicles.filter((vehicle) => vehicle.is_available && vehicle.status === "ACTIVE").length;
  return <div className="space-y-6"><DesktopTopBar title="Mi flota" description={`${vehicles.length} vehículos registrados · ${available} disponibles`} />
    <Card><CardContent className="pt-6"><details><summary className="cursor-pointer font-heading font-semibold">Registrar vehículo</summary>
      <form action={saveVehicleAction} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nombre" name="displayName" placeholder="Camión principal" required /><Field label="Placa" name="plate" placeholder="ABC-123" required />
        <div className="space-y-1.5"><Label htmlFor="vehicleTypeCode">Tipo</Label><select id="vehicleTypeCode" name="vehicleTypeCode" className="h-9 w-full rounded-lg border bg-transparent px-3 text-sm">{TYPES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></div>
        <Field label="Capacidad (kg)" name="capacityKg" type="number" required /><Field label="Volumen (m³)" name="capacityM3" type="number" step="0.001" required />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="covered" /> Carga cubierta</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="refrigerated" /> Refrigerado</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="fourWheelDrive" /> Tracción 4x4</label>
        <Button className="sm:col-span-2 lg:col-span-4">Guardar vehículo</Button>
      </form>
    </details></CardContent></Card>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{vehicles.map((vehicle) => <Card key={vehicle.id}><CardContent className="space-y-4 pt-6">
      <div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary"><Truck className="size-5" /></span><Badge variant={vehicle.is_available ? "default" : "secondary"}>{vehicle.is_available ? "Disponible" : "En operación"}</Badge></div>
      <div><h2 className="font-heading font-semibold">{vehicle.display_name ?? vehicle.vehicle_types?.name}</h2><p className="text-sm text-muted-foreground">{vehicle.vehicle_types?.name} · {vehicle.plate}</p></div>
      <dl className="grid grid-cols-2 gap-3"><Metric label="Capacidad" value={`${Number(vehicle.capacity_kg).toLocaleString("es-PE")} kg`} /><Metric label="Volumen" value={vehicle.capacity_m3 ? `${vehicle.capacity_m3} m³` : "—"} /></dl>
      <Button asChild variant="outline" className="w-full"><Link href={`/vehicles/${vehicle.id}`}>Gestionar vehículo</Link></Button>
    </CardContent></Card>)}</div>
  </div>;
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted/70 p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>; }
