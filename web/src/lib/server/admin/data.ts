import "server-only";

import { getAdminContext } from "./auth";

export interface AdminMetrics {
  totalUsers: number;
  activeListings: number;
  negotiationsInProgress: number;
  activeShipments: number;
  activeRiskEvents: number;
  priceCoveragePercent: number;
  openIncidents: number;
  completedOrders: number;
}

export interface VerificationRequest {
  id: string;
  actorName: string;
  actorKind: string;
  requestedStatus: string;
  status: string;
  documentCount: number;
  createdAt: string;
}

export interface ModerationReport {
  id: string;
  listingTitle: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const { supabase } = await getAdminContext();
  const [users, listings, negotiations, shipments, risks, products, prices, reports, orders] = await Promise.all([
    count(supabase.from("user_profiles").select("id", { count: "exact", head: true })),
    count(supabase.from("market_listings").select("id", { count: "exact", head: true }).eq("status", "ACTIVE")),
    count(supabase.from("negotiations").select("id", { count: "exact", head: true }).in("status", ["OPEN", "OFFER_SUBMITTED", "COUNTERED"])),
    count(supabase.from("shipment_requests").select("id", { count: "exact", head: true }).in("status", ["OPEN_FOR_BIDS", "TRANSPORTER_SELECTED", "SCHEDULED", "PICKED_UP", "IN_TRANSIT", "DELAYED"])),
    count(supabase.from("risk_events").select("id", { count: "exact", head: true }).in("status", ["CONFIRMED", "ACTIVE"])),
    count(supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true)),
    supabase.from("market_price_observations").select("product_id"),
    count(supabase.from("moderation_reports").select("id", { count: "exact", head: true }).in("status", ["OPEN", "REVIEWING"])),
    count(supabase.from("commercial_orders").select("id", { count: "exact", head: true }).eq("status", "COMPLETED")),
  ]);

  if (prices.error) throw new Error(`Could not load price coverage: ${prices.error.message}`);
  const coveredProducts = new Set((prices.data ?? []).map((row) => row.product_id)).size;

  return {
    totalUsers: users,
    activeListings: listings,
    negotiationsInProgress: negotiations,
    activeShipments: shipments,
    activeRiskEvents: risks,
    priceCoveragePercent: products ? Math.round((coveredProducts / products) * 100) : 0,
    openIncidents: reports,
    completedOrders: orders,
  };
}

export async function listVerificationRequests(): Promise<VerificationRequest[]> {
  const { supabase } = await getAdminContext();
  const { data, error } = await supabase
    .from("verification_requests")
    .select("id,status,document_paths,created_at,actors(display_name,kind),verification_statuses(name)")
    .in("status", ["PENDING", "NEEDS_INFO"])
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Could not load verification queue: ${error.message}`);
  return (data ?? []).map((row) => {
    const actor = relation(row.actors);
    const requested = relation(row.verification_statuses);
    return {
      id: row.id,
      actorName: String(actor?.display_name ?? "Usuario"),
      actorKind: String(actor?.kind ?? "PERSON"),
      requestedStatus: String(requested?.name ?? "Verificación"),
      status: row.status,
      documentCount: Array.isArray(row.document_paths) ? row.document_paths.length : 0,
      createdAt: row.created_at,
    };
  });
}

export async function reviewVerification(id: string, status: string, notes?: string) {
  const { supabase } = await getAdminContext();
  const { error } = await supabase.rpc("review_verification_request", {
    p_request_id: id,
    p_status: status,
    ...(notes !== undefined && { p_notes: notes }),
  });
  if (error) throw new Error(`Could not review verification: ${error.message}`);
}

export async function listModerationReports(): Promise<ModerationReport[]> {
  const { supabase } = await getAdminContext();
  const { data, error } = await supabase
    .from("moderation_reports")
    .select("id,reason,details,status,created_at,market_listings(title)")
    .in("status", ["OPEN", "REVIEWING"])
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load moderation queue: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    listingTitle: String(relation(row.market_listings)?.title ?? "Publicación"),
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function reviewModeration(id: string, status: string, action: string, notes?: string) {
  const { supabase } = await getAdminContext();
  const { error } = await supabase.rpc("review_moderation_report", {
    p_report_id: id,
    p_status: status,
    p_action: action,
    ...(notes !== undefined && { p_notes: notes }),
  });
  if (error) throw new Error(`Could not review moderation report: ${error.message}`);
}

async function count(query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const result = await query;
  if (result.error) throw new Error(`Could not load admin metric: ${result.error.message}`);
  return result.count ?? 0;
}

function relation(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined) ?? null;
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}
