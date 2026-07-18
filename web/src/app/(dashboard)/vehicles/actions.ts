"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteVehicle, saveVehicle, setVehicleAvailability } from "@/lib/server/vehicles";

export async function saveVehicleAction(formData: FormData) {
  const id = await saveVehicle({
    id: String(formData.get("id") || "") || null,
    displayName: String(formData.get("displayName")),
    plate: String(formData.get("plate")),
    vehicleTypeCode: String(formData.get("vehicleTypeCode")) as "MOTORCYCLE" | "PICKUP" | "VAN" | "LIGHT_TRUCK" | "MEDIUM_TRUCK" | "HEAVY_TRUCK",
    capacityKg: formData.get("capacityKg"),
    capacityM3: formData.get("capacityM3"),
    covered: formData.get("covered") === "on",
    refrigerated: formData.get("refrigerated") === "on",
    fourWheelDrive: formData.get("fourWheelDrive") === "on",
  });
  revalidatePath("/vehicles");
  redirect(`/vehicles/${id}`);
}

export async function availabilityAction(formData: FormData) {
  const id = String(formData.get("id"));
  await setVehicleAvailability(id, formData.get("available") === "true");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${id}`);
}

export async function deleteVehicleAction(formData: FormData) {
  await deleteVehicle(String(formData.get("id")));
  revalidatePath("/vehicles");
  redirect("/vehicles");
}
