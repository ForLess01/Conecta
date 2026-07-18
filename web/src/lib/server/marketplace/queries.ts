import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PRODUCTS } from "@/lib/mock/products";
import { getCatalogProductId, getDefaultProductImage } from "@/lib/marketplace/catalog";
import type { NegotiationMode, VerificationLevel } from "@/types/domain";
import type { MarketplaceListing } from "./types";

interface ListingRow {
  id: string;
  listing_type: "OFFER" | "REQUEST";
  actor_id: string;
  actor_display_name: string;
  product_id: string;
  product_code: string;
  product_name: string;
  variety_id: string | null;
  variety_code: string | null;
  variety_name: string | null;
  title: string;
  description: string | null;
  quantity: number;
  unit_id: number;
  unit_symbol: string;
  location_label: string;
  approximate_latitude: number;
  approximate_longitude: number;
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
  actor_verification_code: string | null;
  currency_symbol: string | null;
  price_low: number | null;
  price_mid: number | null;
  price_high: number | null;
  price_confidence: number | null;
  price_calculated_at: string | null;
}

function verificationLevel(code: string | null): VerificationLevel {
  if (code === "TECHNICALLY_VERIFIED" || code === "ORGANIZATION_VERIFIED") return "confiable";
  if (code === "IDENTITY_VERIFIED") return "verificado";
  return "sin_verificar";
}

function negotiationMode(row: ListingRow): NegotiationMode {
  const quick = row.quick_negotiation_enabled ?? false;
  const conversational = row.conversational_window_hours !== null;
  if (quick && conversational) return "ambas";
  return quick ? "rapida" : "conversacional";
}

function mapListing(row: ListingRow): MarketplaceListing {
  const catalogProduct = PRODUCTS.find(
    (product) => product.id === getCatalogProductId(row.product_code, row.variety_code)
  );
  const hasPrice = row.price_low != null && row.price_mid != null && row.price_high != null;

  return {
    id: row.id,
    type: row.listing_type === "OFFER" ? "offer" : "request",
    actorId: row.actor_id,
    actorName: row.actor_display_name,
    productId: row.product_id,
    productCode: row.product_code,
    productName: row.product_name,
    varietyId: row.variety_id,
    varietyName: row.variety_name,
    title: row.title,
    description: row.description,
    quantity: Number(row.quantity),
    unitId: row.unit_id,
    unitSymbol: row.unit_symbol,
    locationLabel: row.location_label,
    approximateLatitude: Number(row.approximate_latitude),
    approximateLongitude: Number(row.approximate_longitude),
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
    actorVerification: verificationLevel(row.actor_verification_code),
    imagePosition: catalogProduct?.category === "fibra_alpaca" ? "center 22%" : undefined,
    imageUrl: getDefaultProductImage(row.product_code, row.variety_code),
    negotiationMode: negotiationMode(row),
    priceRange: hasPrice
      ? {
          low: Number(row.price_low),
          central: Number(row.price_mid),
          high: Number(row.price_high),
          unit: row.unit_symbol,
          confidence: Number(row.price_confidence ?? 0),
          updatedAt: row.price_calculated_at ?? row.created_at,
          basis: [],
        }
      : catalogProduct?.priceRange ?? null,
    risk: catalogProduct?.risk ?? null,
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
