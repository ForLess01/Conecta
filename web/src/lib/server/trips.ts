import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMyActorContext } from "@/lib/supabase/session";
import type { Database } from "@/lib/supabase/types.gen";

type OperationArgs = Database["public"]["Functions"]["record_and_transition_trip_operation"]["Args"];
type NullableOperationArgs = Omit<OperationArgs, "p_package_count" | "p_accepted_quantity" | "p_observed_quantity" | "p_condition_notes" | "p_notes"> & {
  p_package_count: number | null;
  p_accepted_quantity: number | null;
  p_observed_quantity: number | null;
  p_condition_notes: string | null;
  p_notes: string | null;
};

export const tripTransitionSchema = z.object({
  tripId: z.string().uuid(),
  status: z.enum(["PICKED_UP", "IN_TRANSIT", "DELAYED", "DELIVERED", "CANCELLED"]),
  notes: z.string().trim().max(1000).optional(),
});

export const operationRecordSchema = z.object({
  tripId: z.string().uuid(),
  recordType: z.enum(["PICKUP", "DELIVERY"]),
  weightKg: z.coerce.number().positive(),
  packageCount: z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().int().positive().nullable()),
  acceptedQuantity: z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().nonnegative().nullable()),
  observedQuantity: z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().nonnegative().nullable()),
  conditionNotes: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(1000).optional(),
  confirmed: z.literal(true),
}).refine((value) => value.recordType !== "DELIVERY" || value.acceptedQuantity !== null, {
  message: "Accepted quantity is required for delivery",
  path: ["acceptedQuantity"],
});

export const incidentSchema = z.object({
  tripId: z.string().uuid(),
  incidentType: z.enum(["DELAY", "ROAD_BLOCK", "BREAKDOWN", "WEIGHT_DIFFERENCE", "DAMAGE", "REJECTION", "OTHER"]),
  description: z.string().trim().min(5).max(2000),
  locationLabel: z.string().trim().max(180).optional(),
});

export type Trip = {
  id: string;
  status: "SCHEDULED" | "PICKED_UP" | "IN_TRANSIT" | "DELAYED" | "DELIVERED" | "CANCELLED";
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  shipment_assignments: {
    shipment_requests: {
      id: string; order_id: string; origin_label: string | null; destination_label: string | null;
      cargo_description: string | null; total_weight_kg: number | null; status: string;
    } | null;
    freight_bids: {
      transporter_actor_id: string; vehicle_id: string; departure_at: string | null;
      vehicles: { display_name: string | null; plate: string | null } | null;
      actors: { display_name: string } | null;
    } | null;
  } | null;
};

const tripSelect = "id,status,started_at,completed_at,created_at,shipment_assignments:shipment_assignment_id(shipment_requests:shipment_request_id(id,order_id,origin_label,destination_label,cargo_description,total_weight_kg,status),freight_bids:freight_bid_id(transporter_actor_id,vehicle_id,departure_at,vehicles:vehicle_id(display_name,plate),actors:transporter_actor_id(display_name)))";

export async function listTrips(): Promise<Trip[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("trips").select(tripSelect).order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load trips: ${error.message}`);
  return (data ?? []) as unknown as Trip[];
}

export async function getTrip(id: string) {
  const supabase = await createClient();
  const [{ data: trip, error }, { data: history, error: historyError }, { data: records, error: recordsError }, { data: incidents, error: incidentsError }, { data: evidence, error: evidenceError }] = await Promise.all([
    supabase.from("trips").select(tripSelect).eq("id", id).maybeSingle(),
    supabase.from("trip_status_history").select("id,status,notes,created_at").eq("trip_id", id).order("created_at"),
    supabase.from("trip_operation_records").select("id,record_type,recorded_weight_kg,package_count,accepted_quantity,observed_quantity,condition_notes,notes,recorded_at").eq("trip_id", id).order("recorded_at"),
    supabase.from("trip_incidents").select("id,incident_type,description,location_label,reported_at,resolved_at").eq("trip_id", id).order("reported_at", { ascending: false }),
    supabase.from("trip_evidence").select("id,evidence_type,original_filename,content_type,byte_size,captured_at,notes").eq("trip_id", id).order("captured_at", { ascending: false }),
  ]);
  if (error) throw new Error(`Could not load trip: ${error.message}`);
  if (historyError) throw new Error(`Could not load trip history: ${historyError.message}`);
  if (recordsError) throw new Error(`Could not load trip records: ${recordsError.message}`);
  if (incidentsError) throw new Error(`Could not load incidents: ${incidentsError.message}`);
  if (evidenceError) throw new Error(`Could not load evidence: ${evidenceError.message}`);
  return { trip: trip as unknown as Trip | null, history: history ?? [], records: records ?? [], incidents: incidents ?? [], evidence: evidence ?? [] };
}

export async function transitionTrip(input: z.input<typeof tripTransitionSchema>) {
  const command = tripTransitionSchema.parse(input);
  const actor = await getMyActorContext();
  if (!actor) throw new Error("Actor context required");
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_trip", {
    p_trip_id: command.tripId,
    p_actor_id: actor.id,
    p_status: command.status,
    ...(command.notes && { p_notes: command.notes }),
  });
  if (error) throw new Error(`Could not transition trip: ${error.message}`);
}

export async function recordTripOperation(input: z.input<typeof operationRecordSchema>) {
  const command = operationRecordSchema.parse(input);
  const actor = await getMyActorContext();
  if (!actor) throw new Error("Actor context required");
  const supabase = await createClient();
  const args = {
    p_trip_id: command.tripId, p_actor_id: actor.id, p_record_type: command.recordType,
    p_weight_kg: command.weightKg, p_package_count: command.packageCount,
    p_accepted_quantity: command.acceptedQuantity, p_observed_quantity: command.observedQuantity,
    p_condition_notes: command.conditionNotes || null, p_notes: command.notes || null, p_confirmed: true,
  } satisfies NullableOperationArgs;
  const { data, error } = await supabase.rpc("record_and_transition_trip_operation", args as OperationArgs);
  if (error) throw new Error(`Could not record trip operation: ${error.message}`);
  return data as string;
}

export async function reportTripIncident(input: z.input<typeof incidentSchema>) {
  const command = incidentSchema.parse(input);
  const actor = await getMyActorContext();
  if (!actor) throw new Error("Actor context required");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("report_trip_incident", {
    p_trip_id: command.tripId, p_actor_id: actor.id, p_incident_type: command.incidentType,
    p_description: command.description, ...(command.locationLabel && { p_location_label: command.locationLabel }),
  });
  if (error) throw new Error(`Could not report incident: ${error.message}`);
  return data as string;
}
