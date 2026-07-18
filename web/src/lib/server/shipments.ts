import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMyActorContext } from "@/lib/supabase/session";

const optionalNumber = z.preprocess(
  (value) => value === "" || value == null ? undefined : Number(value),
  z.number().positive().optional(),
);

export const shipmentDraftSchema = z.object({
  orderId: z.string().uuid(),
  mode: z.enum(["BUYER_PICKUP", "PRODUCER_DELIVERY", "MARKETPLACE_FREIGHT"]),
  originLabel: z.string().trim().max(180).optional(),
  destinationLabel: z.string().trim().max(180).optional(),
  cargoDescription: z.string().trim().max(500).optional(),
  weightKg: optionalNumber,
  volumeM3: optionalNumber,
  packageCount: z.preprocess(
    (value) => value === "" || value == null ? undefined : Number(value),
    z.number().int().positive().optional(),
  ),
  suggestedFare: optionalNumber,
  scheduledPickupAt: z.string().optional(),
  needsHelper: z.boolean().default(false),
  loadingNotes: z.string().trim().max(1000).optional(),
});

export const freightBidSchema = z.object({
  shipmentId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  fare: z.coerce.number().positive(),
  departureAt: z.string().min(1),
  durationMinutes: z.coerce.number().int().positive().max(10080),
  conditions: z.string().trim().max(1000).optional(),
  helperIncluded: z.boolean().default(false),
  insuranceIncluded: z.boolean().default(false),
});

export type Shipment = {
  id: string;
  order_id: string;
  requested_by_actor_id: string;
  logistics_mode: "BUYER_PICKUP" | "PRODUCER_DELIVERY" | "MARKETPLACE_FREIGHT";
  origin_label: string | null;
  destination_label: string | null;
  cargo_description: string | null;
  total_weight_kg: number | null;
  total_volume_m3: number | null;
  package_count: number | null;
  suggested_fare: number | null;
  scheduled_pickup_at: string | null;
  needs_helper: boolean;
  loading_notes: string | null;
  status: string;
  created_at: string;
};

export type FreightBid = {
  id: string;
  transporter_actor_id: string;
  vehicle_id: string;
  fare_amount: number;
  departure_at: string | null;
  estimated_duration_minutes: number | null;
  conditions: string | null;
  helper_included: boolean;
  insurance_included: boolean;
  status: string;
  actors: { display_name: string } | null;
  vehicles: { display_name: string | null; plate: string | null } | null;
};

function fail(error: { message: string } | null, operation: string): never {
  throw new Error(`${operation}: ${error?.message ?? "unknown database error"}`);
}

export async function listOpenShipments(): Promise<Shipment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipment_requests")
    .select("id,order_id,requested_by_actor_id,logistics_mode,origin_label,destination_label,cargo_description,total_weight_kg,total_volume_m3,package_count,suggested_fare,scheduled_pickup_at,needs_helper,loading_notes,status,created_at")
    .eq("status", "OPEN_FOR_BIDS")
    .order("created_at", { ascending: false });
  if (error) fail(error, "Could not load shipments");
  return (data ?? []) as Shipment[];
}

export async function getShipment(id: string): Promise<Shipment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipment_requests")
    .select("id,order_id,requested_by_actor_id,logistics_mode,origin_label,destination_label,cargo_description,total_weight_kg,total_volume_m3,package_count,suggested_fare,scheduled_pickup_at,needs_helper,loading_notes,status,created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) fail(error, "Could not load shipment");
  return data as Shipment | null;
}

export async function getOrderLogistics(orderId: string) {
  const supabase = await createClient();
  const [{ data: order, error: orderError }, { data: shipment, error: shipmentError }] = await Promise.all([
    supabase.from("commercial_orders").select("id,status").eq("id", orderId).maybeSingle(),
    supabase.from("shipment_requests")
      .select("id,order_id,requested_by_actor_id,logistics_mode,origin_label,destination_label,cargo_description,total_weight_kg,total_volume_m3,package_count,suggested_fare,scheduled_pickup_at,needs_helper,loading_notes,status,created_at")
      .eq("order_id", orderId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (orderError) fail(orderError, "Could not load order");
  if (shipmentError) fail(shipmentError, "Could not load order shipment");
  return { order, shipment: shipment as Shipment | null };
}

export async function listShipmentBids(shipmentId: string): Promise<FreightBid[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("freight_bids")
    .select("id,transporter_actor_id,vehicle_id,fare_amount,departure_at,estimated_duration_minutes,conditions,helper_included,insurance_included,status,actors:transporter_actor_id(display_name),vehicles:vehicle_id(display_name,plate)")
    .eq("shipment_request_id", shipmentId)
    .order("fare_amount");
  if (error) fail(error, "Could not load freight bids");
  return (data ?? []) as unknown as FreightBid[];
}

export async function saveShipmentDraft(input: z.input<typeof shipmentDraftSchema>) {
  const command = shipmentDraftSchema.parse(input);
  const actor = await getMyActorContext();
  if (!actor) throw new Error("Actor context required");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_shipment_draft", {
    p_order_id: command.orderId,
    p_actor_id: actor.id,
    p_logistics_mode: command.mode,
    ...(command.originLabel && { p_origin_label: command.originLabel }),
    ...(command.destinationLabel && { p_destination_label: command.destinationLabel }),
    ...(command.cargoDescription && { p_cargo_description: command.cargoDescription }),
    ...(command.weightKg !== undefined && { p_weight_kg: command.weightKg }),
    ...(command.volumeM3 !== undefined && { p_volume_m3: command.volumeM3 }),
    ...(command.packageCount !== undefined && { p_package_count: command.packageCount }),
    ...(command.suggestedFare !== undefined && { p_suggested_fare: command.suggestedFare }),
    ...(command.scheduledPickupAt && { p_scheduled_pickup_at: command.scheduledPickupAt }),
    p_needs_helper: command.needsHelper,
    ...(command.loadingNotes && { p_loading_notes: command.loadingNotes }),
  });
  if (error) fail(error, "Could not save shipment");
  return data as string;
}

export async function publishShipment(shipmentId: string) {
  const actor = await getMyActorContext();
  if (!actor) throw new Error("Actor context required");
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_shipment", { p_shipment_id: shipmentId, p_actor_id: actor.id });
  if (error) fail(error, "Could not publish shipment");
}

export async function submitFreightBid(input: z.input<typeof freightBidSchema>) {
  const command = freightBidSchema.parse(input);
  const actor = await getMyActorContext();
  if (!actor || !actor.roles.includes("transportista")) throw new Error("Transporter actor required");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_freight_bid", {
    p_shipment_id: command.shipmentId,
    p_actor_id: actor.id,
    p_vehicle_id: command.vehicleId,
    p_fare: command.fare,
    p_departure_at: command.departureAt,
    p_duration_minutes: command.durationMinutes,
    ...(command.conditions && { p_conditions: command.conditions }),
    p_helper_included: command.helperIncluded,
    p_insurance_included: command.insuranceIncluded,
  });
  if (error) fail(error, "Could not submit freight bid");
  return data as string;
}

export async function withdrawFreightBid(bidId: string) {
  const actor = await getMyActorContext();
  if (!actor) throw new Error("Actor context required");
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_freight_bid", { p_bid_id: bidId, p_actor_id: actor.id });
  if (error) fail(error, "Could not withdraw freight bid");
}

export async function selectFreightBid(bidId: string) {
  const actor = await getMyActorContext();
  if (!actor) throw new Error("Actor context required");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("select_freight_bid", { p_bid_id: bidId, p_actor_id: actor.id });
  if (error) fail(error, "Could not select freight bid");
  return data as string;
}
