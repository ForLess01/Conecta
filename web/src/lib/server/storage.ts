import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMyActorContext } from "@/lib/supabase/session";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_BYTES = 10 * 1024 * 1024;
const evidenceTypeSchema = z.enum(["PICKUP_PHOTO", "DELIVERY_PHOTO", "WEIGHT_TICKET", "SIGNATURE", "DOCUMENT", "OTHER"]);

export async function uploadTripEvidence(tripId: string, evidenceType: string, file: File, notes?: string) {
  const actor = await getMyActorContext();
  if (!actor || !actor.roles.includes("transportista")) throw new Error("Transporter actor required");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Only JPEG, PNG, WebP, or PDF evidence is accepted");
  if (file.size < 1 || file.size > MAX_BYTES) throw new Error("Evidence must be between 1 byte and 10 MB");
  const parsedEvidenceType = evidenceTypeSchema.parse(evidenceType);

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${actor.id}/${tripId}/${randomUUID()}.${extension}`;
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage.from("trip-evidence").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error(`Could not upload evidence: ${uploadError.message}`);

  const { error: recordError } = await supabase.rpc("add_trip_evidence", {
    p_trip_id: tripId,
    p_actor_id: actor.id,
    p_evidence_type: parsedEvidenceType,
    p_storage_path: path,
    p_original_filename: file.name.slice(0, 255),
    p_content_type: file.type,
    p_byte_size: file.size,
    ...(notes && { p_notes: notes }),
  });
  if (recordError) {
    await supabase.storage.from("trip-evidence").remove([path]);
    throw new Error(`Could not record evidence: ${recordError.message}`);
  }
  return path;
}
