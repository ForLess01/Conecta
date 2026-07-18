import Link from "next/link";
import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyVehicle } from "@/lib/server/vehicles";
import { availabilityAction, deleteVehicleAction, saveVehicleAction } from "../actions";

const TYPES = [["MOTORCYCLE", "Motocarga"], ["PICKUP", "Pickup"], ["VAN", "Furgón"], ["LIGHT_TRUCK", "Camión ligero"], ["MEDIUM_TRUCK", "Camión mediano"], ["HEAVY_TRUCK", "Camión pesado"]];

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const vehicle = await getMyVehicle(id); if (!vehicle) notFound();
  return <div className="space-y-6"><DesktopTopBar title={vehicle.display_name ?? "Vehículo"} description={`${vehicle.vehicle_types?.name} · placa ${vehicle.plate}`} />
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"><Card><CardContent className="pt-6"><form action={saveVehicleAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={vehicle.id} /><Field label="Nombre" name="displayName" defaultValue={vehicle.display_name ?? vehicle.vehicle_types?.name ?? "Vehículo"} required /><Field label="Placa" name="plate" defaultValue={vehicle.plate ?? ""} required />
      <div className="space-y-1.5"><Label htmlFor="vehicleTypeCode">Tipo</Label><select id="vehicleTypeCode" name="vehicleTypeCode" defaultValue={vehicle.vehicle_types?.code} className="h-9 w-full rounded-lg border bg-transparent px-3 text-sm">{TYPES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></div>
      <Field label="Capacidad (kg)" name="capacityKg" type="number" defaultValue={vehicle.capacity_kg} required /><Field label="Volumen (m³)" name="capacityM3" type="number" step="0.001" defaultValue={vehicle.capacity_m3 ?? ""} required />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="covered" defaultChecked={vehicle.covered} /> Carga cubierta</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="refrigerated" defaultChecked={vehicle.refrigerated} /> Refrigerado</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="fourWheelDrive" defaultChecked={vehicle.four_wheel_drive} /> Tracción 4x4</label>
      <Button className="sm:col-span-2">Guardar cambios</Button>
    </form></CardContent></Card>
    <div className="space-y-4"><Card><CardContent className="space-y-4 pt-6"><div className="flex items-center justify-between"><span className="font-medium">Disponibilidad</span><Badge variant={vehicle.is_available ? "default" : "secondary"}>{vehicle.is_available ? "Disponible" : "No disponible"}</Badge></div>
      <form action={availabilityAction}><input type="hidden" name="id" value={vehicle.id} /><input type="hidden" name="available" value={String(!vehicle.is_available)} /><Button variant="outline" className="w-full">{vehicle.is_available ? "Marcar no disponible" : "Marcar disponible"}</Button></form>
      <form action={deleteVehicleAction}><input type="hidden" name="id" value={vehicle.id} /><Button variant="destructive" className="w-full">Eliminar vehículo</Button></form>
    </CardContent></Card><Button asChild variant="ghost" className="w-full"><Link href="/vehicles">Volver a mi flota</Link></Button></div></div>
  </div>;
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>; }
