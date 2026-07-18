import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MarketplaceListing } from "./types";

interface ListingRow {
  id: string;
  listing_type: "OFFER" | "REQUEST";
  actor_id: string;
  actor_display_name: string;
  product_id: string;
  product_name: string;
  variety_id: string | null;
  variety_name: string | null;
  title: string;
  description: string | null;
  quantity: number;
  unit_id: number;
  unit_symbol: string;
  location_label: string;
  available_from: string | null;
  deadline_at: string | null;
  created_at: string;
  minimum_order_quantity: number | null;
  allow_partial_quantity: boolean | null;
  accepts_partial_offers: boolean | null;
  accepts_multiple_suppliers: boolean | null;
  quick_negotiation_enabled: boolean | null;
  conversational_window_hours: number | null;
  saved: boolean;
}

function mapListing(row: ListingRow): MarketplaceListing {
  return {
    id: row.id,
    type: row.listing_type === "OFFER" ? "offer" : "request",
    actorId: row.actor_id,
    actorName: row.actor_display_name,
    productId: row.product_id,
    productName: row.product_name,
    varietyId: row.variety_id,
    varietyName: row.variety_name,
    title: row.title,
    description: row.description,
    quantity: Number(row.quantity),
    unitId: row.unit_id,
    unitSymbol: row.unit_symbol,
    locationLabel: row.location_label,
    availableFrom: row.available_from,
    deadlineAt: row.deadline_at,
    createdAt: row.created_at,
    minimumOrderQuantity: row.minimum_order_quantity === null ? null : Number(row.minimum_order_quantity),
    allowPartialQuantity: row.allow_partial_quantity ?? false,
    acceptsPartialOffers: row.accepts_partial_offers ?? false,
    acceptsMultipleSuppliers: row.accepts_multiple_suppliers ?? false,
    quickNegotiationEnabled: row.quick_negotiation_enabled ?? false,
    conversationalWindowHours: row.conversational_window_hours ?? 24,
    saved: row.saved,
  };
}

export async function getActiveListings(options: { query?: string; type?: "OFFER" | "REQUEST"; limit?: number } = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_active_marketplace_listings", {
    p_limit: options.limit ?? 60,
    p_listing_type: options.type ?? undefined,
    p_listing_id: undefined,
    p_query: options.query ?? undefined,
  });
  if (error) throw new Error(`No se pudo cargar el marketplace: ${error.message}`);
  return ((data ?? []) as ListingRow[]).map(mapListing);
}

export async function getActiveListing(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_active_marketplace_listings", {
    p_limit: 1,
    p_listing_type: undefined,
    p_listing_id: id,
    p_query: undefined,
  });
  if (error) throw new Error(`No se pudo cargar la publicación: ${error.message}`);
  const row = (data?.[0] ?? null) as ListingRow | null;
  return row ? mapListing(row) : null;
}
