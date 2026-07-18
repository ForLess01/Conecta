"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { selectFreightBid, submitFreightBid, withdrawFreightBid } from "@/lib/server/shipments";

export async function submitBidAction(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId"));
  await submitFreightBid({
    shipmentId,
    vehicleId: String(formData.get("vehicleId")),
    fare: formData.get("fare"),
    departureAt: String(formData.get("departureAt")),
    durationMinutes: Number(formData.get("durationHours")) * 60,
    conditions: String(formData.get("conditions") ?? ""),
    helperIncluded: formData.get("helperIncluded") === "on",
    insuranceIncluded: formData.get("insuranceIncluded") === "on",
  });
  revalidatePath(`/transport/${shipmentId}`);
  redirect(`/transport/${shipmentId}/compare`);
}

export async function withdrawBidAction(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId"));
  await withdrawFreightBid(String(formData.get("bidId")));
  revalidatePath(`/transport/${shipmentId}/compare`);
}

export async function selectBidAction(formData: FormData) {
  const tripId = await selectFreightBid(String(formData.get("bidId")));
  revalidatePath("/trips");
  redirect(`/trips/${tripId}`);
}
