import "server-only";

import { createClient } from "@/lib/supabase/server";
import { labelForConfidence, type PriceSuggestion } from "@/lib/server/pricing/pricing-service";
import type { ProductCategory } from "@/types/domain";

const PRODUCT_CODE: Record<ProductCategory, string> = {
  papa: "POTATO",
  fibra_alpaca: "ALPACA_FIBER",
  quinua: "QUINOA",
  cebolla: "ONION",
  trucha: "TROUT",
};

type SuggestionRow = {
  listing_id: string;
  price_low: number;
  price_mid: number;
  price_high: number;
  confidence: number;
  calculated_at: string;
  units_of_measure: { symbol: string } | null;
};

function toSuggestion(row: SuggestionRow, basis: string): PriceSuggestion {
  return {
    low: Number(row.price_low),
    central: Number(row.price_mid),
    high: Number(row.price_high),
    unit: row.units_of_measure?.symbol ?? "unidad",
    confidence: Number(row.confidence),
    confidenceLabel: labelForConfidence(Number(row.confidence)),
    updatedAt: row.calculated_at,
    basis,
  };
}

export async function getOfferSuggestion(listingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_price_suggestions")
    .select("listing_id,price_low,price_mid,price_high,confidence,calculated_at,units_of_measure(symbol)")
    .eq("listing_id", listingId)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toSuggestion(data as SuggestionRow, "Última sugerencia calculada para esta publicación.") : null;
}

export async function getCategorySuggestion(category: ProductCategory) {
  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .ilike("code", PRODUCT_CODE[category])
    .maybeSingle();
  if (productError) throw new Error(productError.message);
  if (!product) return null;

  const { data: listings, error: listingsError } = await supabase
    .from("market_listings")
    .select("id")
    .eq("product_id", product.id)
    .eq("status", "ACTIVE");
  if (listingsError) throw new Error(listingsError.message);
  const listingIds = (listings ?? []).map((listing) => listing.id);
  if (!listingIds.length) return null;

  const { data, error } = await supabase
    .from("listing_price_suggestions")
    .select("listing_id,price_low,price_mid,price_high,confidence,calculated_at,units_of_measure(symbol)")
    .in("listing_id", listingIds)
    .order("calculated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const latest = new Map<string, SuggestionRow>();
  for (const row of (data ?? []) as SuggestionRow[]) {
    if (!latest.has(row.listing_id)) latest.set(row.listing_id, row);
  }
  const rows = [...latest.values()];
  if (!rows.length) return null;
  const average = (key: "price_low" | "price_mid" | "price_high" | "confidence") =>
    rows.reduce((sum, row) => sum + Number(row[key]), 0) / rows.length;
  return toSuggestion({
    ...rows[0],
    price_low: average("price_low"),
    price_mid: average("price_mid"),
    price_high: average("price_high"),
    confidence: average("confidence"),
  }, `Promedio de ${rows.length} publicaciones activas con sugerencia vigente.`);
}
