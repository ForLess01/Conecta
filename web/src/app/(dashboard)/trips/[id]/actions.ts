"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordTripOperation, reportTripIncident, transitionTrip } from "@/lib/server/trips";
import { uploadTripEvidence } from "@/lib/server/storage";

async function saveEvidence(formData: FormData, tripId: string, evidenceType: string) {
  const file = formData.get("evidence");
  if (file instanceof File && file.size > 0) {
    await uploadTripEvidence(tripId, evidenceType, file, String(formData.get("notes") ?? ""));
  }
}

export async function transitionTripAction(formData: FormData) {
  const tripId = String(formData.get("tripId"));
  await transitionTrip({ tripId, status: String(formData.get("status")) as "PICKED_UP" | "IN_TRANSIT" | "DELAYED" | "DELIVERED" | "CANCELLED", notes: String(formData.get("notes") ?? "") });
  revalidatePath(`/trips/${tripId}`);
}

export async function pickupAction(formData: FormData) {
  const tripId = String(formData.get("tripId"));
  const confirmed = formData.get("confirmed") === "true";
  if (!confirmed) throw new Error("Debes confirmar el recojo antes de registrarlo.");
  await recordTripOperation({
    tripId, recordType: "PICKUP", weightKg: formData.get("weightKg"), packageCount: formData.get("packageCount"),
    acceptedQuantity: null, observedQuantity: null, conditionNotes: String(formData.get("conditionNotes") ?? ""),
    notes: String(formData.get("notes") ?? ""), confirmed,
  });
  await saveEvidence(formData, tripId, "PICKUP_PHOTO");
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function deliveryAction(formData: FormData) {
  const tripId = String(formData.get("tripId"));
  const confirmed = formData.get("confirmed") === "true";
  if (!confirmed) throw new Error("Debes confirmar la entrega antes de registrarla.");
  await recordTripOperation({
    tripId, recordType: "DELIVERY", weightKg: formData.get("weightKg"), packageCount: null,
    acceptedQuantity: formData.get("acceptedQuantity"), observedQuantity: formData.get("observedQuantity"),
    conditionNotes: String(formData.get("conditionNotes") ?? ""), notes: String(formData.get("notes") ?? ""), confirmed,
  });
  await saveEvidence(formData, tripId, "DELIVERY_PHOTO");
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function incidentAction(formData: FormData) {
  const tripId = String(formData.get("tripId"));
  await reportTripIncident({
    tripId, incidentType: String(formData.get("incidentType")) as "DELAY" | "ROAD_BLOCK" | "BREAKDOWN" | "WEIGHT_DIFFERENCE" | "DAMAGE" | "REJECTION" | "OTHER",
    description: String(formData.get("description")), locationLabel: String(formData.get("locationLabel") ?? ""),
  });
  await saveEvidence(formData, tripId, "OTHER");
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}
