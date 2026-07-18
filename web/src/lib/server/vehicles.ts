import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMyActorContext } from "@/lib/supabase/session";
import type { Database } from "@/lib/supabase/types.gen";

type SaveVehicleArgs = Database["public"]["Functions"]["save_vehicle"]["Args"];
type NullableSaveVehicleArgs = Omit<SaveVehicleArgs, "p_vehicle_id" | "p_capacity_m3"> & {
  p_vehicle_id: string | null;
  p_capacity_m3: number | null;
};

export const vehicleSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  displayName: z.string().trim().min(2).max(80),
  plate: z.string().trim().min(5).max(12).regex(/^[A-Za-z0-9-]+$/),
  vehicleTypeCode: z.enum(["MOTORCYCLE", "PICKUP", "VAN", "LIGHT_TRUCK", "MEDIUM_TRUCK", "HEAVY_TRUCK"]),
  capacityKg: z.coerce.number().positive().max(100000),
  capacityM3: z.preprocess((value) => value === "" ? null : Number(value), z.number().positive().max(500).nullable()),
  covered: z.boolean().default(false),
  refrigerated: z.boolean().default(false),
  fourWheelDrive: z.boolean().default(false),
});

export type Vehicle = {
  id: string;
  owner_actor_id: string;
  display_name: string | null;
  plate: string | null;
  capacity_kg: number;
  capacity_m3: number | null;
  covered: boolean;
  refrigerated: boolean;
  four_wheel_drive: boolean;
  status: string;
  is_available: boolean;
  vehicle_types: { code: string; name: string } | null;
};

export async function listMyVehicles(availableOnly = false): Promise<Vehicle[]> {
  const actor = await getMyActorContext();
  if (!actor) return [];
  const supabase = await createClient();
  let query = supabase.from("vehicles")
    .select("id,owner_actor_id,display_name,plate,capacity_kg,capacity_m3,covered,refrigerated,four_wheel_drive,status,is_available,vehicle_types:vehicle_type_id(code,name)")
    .eq("owner_actor_id", actor.id).eq("status", "ACTIVE").order("created_at", { ascending: false });
  if (availableOnly) query = query.eq("is_available", true);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load vehicles: ${error.message}`);
  return (data ?? []) as unknown as Vehicle[];
}

export async function getMyVehicle(id: string): Promise<Vehicle | null> {
  const actor = await getMyActorContext();
  if (!actor) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("vehicles")
    .select("id,owner_actor_id,display_name,plate,capacity_kg,capacity_m3,covered,refrigerated,four_wheel_drive,status,is_available,vehicle_types:vehicle_type_id(code,name)")
    .eq("id", id).eq("owner_actor_id", actor.id).eq("status", "ACTIVE").maybeSingle();
  if (error) throw new Error(`Could not load vehicle: ${error.message}`);
  return data as unknown as Vehicle | null;
}

export async function saveVehicle(input: z.input<typeof vehicleSchema>) {
  const vehicle = vehicleSchema.parse(input);
  const actor = await getMyActorContext();
  if (!actor || !actor.roles.includes("transportista")) throw new Error("Transporter actor required");
  const supabase = await createClient();
  const args = {
    p_actor_id: actor.id,
    p_vehicle_id: vehicle.id ?? null,
    p_display_name: vehicle.displayName,
    p_plate: vehicle.plate,
    p_vehicle_type_code: vehicle.vehicleTypeCode,
    p_capacity_kg: vehicle.capacityKg,
    p_capacity_m3: vehicle.capacityM3,
    p_covered: vehicle.covered,
    p_refrigerated: vehicle.refrigerated,
    p_four_wheel_drive: vehicle.fourWheelDrive,
  } satisfies NullableSaveVehicleArgs;
  const { data, error } = await supabase.rpc("save_vehicle", args as SaveVehicleArgs);
  if (error) throw new Error(`Could not save vehicle: ${error.message}`);
  return data as string;
}

export async function setVehicleAvailability(id: string, available: boolean) {
  const actor = await getMyActorContext();
  if (!actor) throw new Error("Actor context required");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_vehicle_availability", { p_vehicle_id: id, p_actor_id: actor.id, p_available: available });
  if (error) throw new Error(`Could not update vehicle availability: ${error.message}`);
}

export async function deleteVehicle(id: string) {
  const actor = await getMyActorContext();
  if (!actor) throw new Error("Actor context required");
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_vehicle", { p_vehicle_id: id, p_actor_id: actor.id });
  if (error) throw new Error(`Could not delete vehicle: ${error.message}`);
}
