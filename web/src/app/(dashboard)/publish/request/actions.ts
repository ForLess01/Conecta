"use server";

import { redirect } from "next/navigation";
import { getMyActorContext, requireUser } from "@/lib/supabase/session";
import type { Database } from "@/lib/supabase/types.gen";

type RequestArgs = Database["public"]["Functions"]["create_purchase_request"]["Args"];
type NullableRequestArgs = Omit<RequestArgs, "p_variety_id" | "p_delivery_deadline"> & {
  p_variety_id: string | null;
  p_delivery_deadline: string | null;
};

function required(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`Falta el campo ${name}.`);
  return value;
}

export async function createRequest(formData: FormData) {
  const actor = await getMyActorContext();
  if (!actor || !actor.roles.includes("comprador")) throw new Error("Necesitás un perfil comprador para publicar.");
  const { supabase } = await requireUser();
  const publish = formData.get("intent") !== "draft";
  const quantity = Number(required(formData, "quantity"));
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("La cantidad debe ser mayor que cero.");
  const deadline = required(formData, "deadline");
  const latitude = Number(required(formData, "latitude"));
  const longitude = Number(required(formData, "longitude"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error("Las coordenadas no son válidas.");
  const args = {
    p_actor_id: actor.id,
    p_product_id: required(formData, "productId"),
    p_variety_id: String(formData.get("varietyId") ?? "") || null,
    p_title: required(formData, "title"),
    p_description: String(formData.get("description") ?? ""),
    p_quantity: quantity,
    p_unit_id: Number(required(formData, "unitId")),
    p_location_label: required(formData, "locationLabel"),
    p_latitude: latitude,
    p_longitude: longitude,
    p_deadline_at: new Date(`${deadline}T23:59:59-05:00`).toISOString(),
    p_delivery_deadline: String(formData.get("deliveryDeadline") ?? "") || null,
    p_accepts_partial_offers: formData.get("acceptsPartial") === "on",
    p_accepts_multiple_suppliers: formData.get("acceptsMultiple") === "on",
    p_publish: publish,
  } satisfies NullableRequestArgs;
  const { data, error } = await supabase.rpc("create_purchase_request", args as RequestArgs);
  if (error) throw new Error(`No se pudo crear el requerimiento: ${error.message}`);
  redirect(publish ? `/marketplace/requests/${data}` : "/marketplace");
}
