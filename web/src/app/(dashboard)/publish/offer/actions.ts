"use server";

import { redirect } from "next/navigation";
import { getMyActorContext, requireUser } from "@/lib/supabase/session";
import type { Database } from "@/lib/supabase/types.gen";

type OfferArgs = Database["public"]["Functions"]["create_market_offer"]["Args"];
type NullableOfferArgs = Omit<OfferArgs, "p_variety_id" | "p_available_from" | "p_hidden_floor_price"> & {
  p_variety_id: string | null;
  p_available_from: string | null;
  p_hidden_floor_price: number | null;
};

function required(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`Falta el campo ${name}.`);
  return value;
}

function positiveNumber(formData: FormData, name: string) {
  const value = Number(required(formData, name));
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} debe ser mayor que cero.`);
  return value;
}

export async function createOffer(formData: FormData) {
  const actor = await getMyActorContext();
  if (!actor || !actor.roles.includes("productor")) throw new Error("Necesitás un perfil productor para publicar.");
  const { supabase } = await requireUser();
  const publish = formData.get("intent") !== "draft";
  const quick = formData.get("quickNegotiation") === "on";
  const floorText = String(formData.get("hiddenFloorPrice") ?? "").trim();
  const latitude = Number(required(formData, "latitude"));
  const longitude = Number(required(formData, "longitude"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error("Las coordenadas no son válidas.");
  const args = {
    p_actor_id: actor.id,
    p_product_id: required(formData, "productId"),
    p_variety_id: String(formData.get("varietyId") ?? "") || null,
    p_title: required(formData, "title"),
    p_description: String(formData.get("description") ?? ""),
    p_quantity: positiveNumber(formData, "quantity"),
    p_unit_id: positiveNumber(formData, "unitId"),
    p_minimum_order_quantity: positiveNumber(formData, "minimumOrderQuantity"),
    p_allow_partial_quantity: formData.get("allowPartial") === "on",
    p_location_label: required(formData, "locationLabel"),
    p_latitude: latitude,
    p_longitude: longitude,
    p_available_from: String(formData.get("availableFrom") ?? "") || null,
    p_quick_negotiation_enabled: quick,
    p_conversational_window_hours: positiveNumber(formData, "conversationHours"),
    p_hidden_floor_price: floorText ? Number(floorText) : null,
    p_publish: publish,
  } satisfies NullableOfferArgs;
  const { data, error } = await supabase.rpc("create_market_offer", args as OfferArgs);
  if (error) throw new Error(`No se pudo crear la oferta: ${error.message}`);
  redirect(publish ? `/marketplace/offers/${data}` : "/marketplace");
}
