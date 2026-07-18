"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { publishShipment, saveShipmentDraft } from "@/lib/server/shipments";

export async function saveShipmentAction(formData: FormData) {
  const shipmentId = await saveShipmentDraft({
    orderId: String(formData.get("orderId")),
    mode: String(formData.get("mode")) as "BUYER_PICKUP" | "PRODUCER_DELIVERY" | "MARKETPLACE_FREIGHT",
    originLabel: String(formData.get("originLabel") ?? ""),
    destinationLabel: String(formData.get("destinationLabel") ?? ""),
    cargoDescription: String(formData.get("cargoDescription") ?? ""),
    weightKg: formData.get("weightKg"),
    volumeM3: formData.get("volumeM3"),
    packageCount: formData.get("packageCount"),
    suggestedFare: formData.get("suggestedFare"),
    scheduledPickupAt: String(formData.get("scheduledPickupAt") ?? ""),
    needsHelper: formData.get("needsHelper") === "on",
    loadingNotes: String(formData.get("loadingNotes") ?? ""),
  });
  if (formData.get("intent") === "publish") await publishShipment(shipmentId);
  revalidatePath("/transport");
  redirect(formData.get("intent") === "publish" ? `/transport/${shipmentId}` : `/transport/${shipmentId}/compare`);
}

export async function selectLogisticsModeAction(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  const mode = String(formData.get("mode")) as "BUYER_PICKUP" | "PRODUCER_DELIVERY" | "MARKETPLACE_FREIGHT";
  await saveShipmentDraft({ orderId, mode, needsHelper: false });
  revalidatePath(`/orders/${orderId}`);
  redirect(mode === "MARKETPLACE_FREIGHT" ? `/transport/new?orderId=${orderId}` : `/orders/${orderId}`);
}
