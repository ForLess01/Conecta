import "server-only";

import { getAdminContext } from "@/lib/server/admin/auth";
import type { Database } from "@/lib/supabase/types.gen";
import { parsePriceCsv } from "./csv";

export { parsePriceCsv } from "./csv";

export interface PriceObservationInput {
  productId: string;
  varietyId?: string | null;
  administrativeAreaId?: string | null;
  marketName?: string | null;
  observedOn: string;
  unitId: number;
  currencyId: number;
  priceLow?: number | null;
  priceMid: number;
  priceHigh?: number | null;
  sourceId: number;
  sourceUrl?: string | null;
}

export interface PriceObservation {
  id: string;
  product: string;
  variety: string | null;
  market: string | null;
  region: string | null;
  observedOn: string;
  low: number | null;
  mid: number;
  high: number | null;
  source: string;
  sourceUrl: string | null;
}

type PriceObservationInsert = Database["public"]["Tables"]["market_price_observations"]["Insert"];
type PriceObservationUpdate = Database["public"]["Tables"]["market_price_observations"]["Update"];

export async function listPriceObservations(): Promise<PriceObservation[]> {
  const { supabase } = await getAdminContext();
  const { data, error } = await supabase
    .from("market_price_observations")
    .select("id,market_name,observed_on,price_low,price_mid,price_high,source_url,products(name),product_varieties(name),administrative_areas(name),price_sources(name)")
    .order("observed_on", { ascending: false })
    .limit(200);
  if (error) throw new Error(`Could not load price observations: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    product: relationName(row.products) ?? "Producto",
    variety: relationName(row.product_varieties),
    market: row.market_name,
    region: relationName(row.administrative_areas),
    observedOn: row.observed_on,
    low: numberOrNull(row.price_low),
    mid: Number(row.price_mid),
    high: numberOrNull(row.price_high),
    source: relationName(row.price_sources) ?? "Fuente",
    sourceUrl: row.source_url,
  }));
}

export async function getPriceCatalogs() {
  const { supabase } = await getAdminContext();
  const [products, varieties, areas, sources, units, currencies] = await Promise.all([
    supabase.from("products").select("id,name").eq("is_active", true).order("name"),
    supabase.from("product_varieties").select("id,name,product_id").eq("is_active", true).order("name"),
    supabase.from("administrative_areas").select("id,name").order("name").limit(500),
    supabase.from("price_sources").select("id,name").order("name"),
    supabase.from("units_of_measure").select("id,name,symbol").order("name"),
    supabase.from("currencies").select("id,code,symbol").order("code"),
  ]);
  const failed = [products, varieties, areas, sources, units, currencies].find((result) => result.error);
  if (failed?.error) throw new Error(`Could not load price catalogs: ${failed.error.message}`);
  return {
    products: products.data ?? [],
    varieties: varieties.data ?? [],
    areas: areas.data ?? [],
    sources: sources.data ?? [],
    units: units.data ?? [],
    currencies: currencies.data ?? [],
  };
}

export async function createPriceObservation(input: PriceObservationInput) {
  const { supabase, userId } = await getAdminContext();
  const { data, error } = await supabase.from("market_price_observations").insert(toInsertRow(input)).select("id").single();
  if (error) throw new Error(`Could not create price observation: ${error.message}`);
  await audit(supabase, userId, "PRICE_OBSERVATION_CREATED", data.id);
  return data.id;
}

export async function updatePriceObservation(id: string, input: Partial<PriceObservationInput>) {
  const { supabase, userId } = await getAdminContext();
  const { error } = await supabase.from("market_price_observations").update(toUpdateRow(input)).eq("id", id);
  if (error) throw new Error(`Could not update price observation: ${error.message}`);
  await audit(supabase, userId, "PRICE_OBSERVATION_UPDATED", id);
}

export async function deletePriceObservation(id: string) {
  const { supabase, userId } = await getAdminContext();
  const { error } = await supabase.from("market_price_observations").delete().eq("id", id);
  if (error) throw new Error(`Could not delete price observation: ${error.message}`);
  await audit(supabase, userId, "PRICE_OBSERVATION_DELETED", id);
}

export async function importPriceCsv(csv: string): Promise<number> {
  const rows = parsePriceCsv(csv);
  if (rows.length > 500) throw new Error("CSV cannot contain more than 500 observations.");
  const { supabase, userId } = await getAdminContext();
  const [products, varieties, sources, units, currencies] = await Promise.all([
    supabase.from("products").select("id,code"),
    supabase.from("product_varieties").select("id,code,product_id"),
    supabase.from("price_sources").select("id,code"),
    supabase.from("units_of_measure").select("id,code"),
    supabase.from("currencies").select("id,code"),
  ]);
  const failed = [products, varieties, sources, units, currencies].find((result) => result.error);
  if (failed?.error) throw new Error(`Could not resolve CSV catalogs: ${failed.error.message}`);

  const productMap = idMap<string>((products.data ?? []) as Array<{ id: string; code: string }>);
  const sourceMap = idMap<number>((sources.data ?? []) as Array<{ id: number; code: string }>);
  const unitMap = idMap<number>((units.data ?? []) as Array<{ id: number; code: string }>);
  const currencyMap = idMap<number>((currencies.data ?? []) as Array<{ id: number; code: string }>);
  const inserts = rows.map((row, index) => {
    const productId = productMap.get(row.product_code.toUpperCase());
    const sourceId = sourceMap.get(row.source_code.toUpperCase());
    const unitId = unitMap.get(row.unit_code.toUpperCase());
    const currencyId = currencyMap.get(row.currency_code.toUpperCase());
    const variety = row.variety_code
      ? (varieties.data ?? []).find((item) => String(item.code).toUpperCase() === row.variety_code?.toUpperCase() && item.product_id === productId)
      : null;
    if (!productId || !sourceId || !unitId || !currencyId || (row.variety_code && !variety)) {
      throw new Error(`CSV row ${index + 2} references an unknown catalog code.`);
    }
    return toInsertRow({
      productId,
      varietyId: variety?.id ?? null,
      marketName: row.market_name || null,
      observedOn: row.observed_on,
      priceLow: optionalNumber(row.price_low),
      priceMid: requiredNumber(row.price_mid, index + 2),
      priceHigh: optionalNumber(row.price_high),
      sourceId,
      unitId,
      currencyId,
      sourceUrl: row.source_url || null,
    });
  });

  const { error } = await supabase.from("market_price_observations").insert(inserts);
  if (error) throw new Error(`Could not import price observations: ${error.message}`);
  await audit(supabase, userId, "PRICE_OBSERVATIONS_IMPORTED", String(rows.length));
  return rows.length;
}

function toInsertRow(input: PriceObservationInput): PriceObservationInsert {
  return {
    product_id: input.productId,
    observed_on: input.observedOn,
    unit_id: input.unitId,
    currency_id: input.currencyId,
    price_mid: input.priceMid,
    source_id: input.sourceId,
    ...(input.varietyId !== undefined && { variety_id: input.varietyId }),
    ...(input.administrativeAreaId !== undefined && { administrative_area_id: input.administrativeAreaId }),
    ...(input.marketName !== undefined && { market_name: input.marketName }),
    ...(input.priceLow !== undefined && { price_low: input.priceLow }),
    ...(input.priceHigh !== undefined && { price_high: input.priceHigh }),
    ...(input.sourceUrl !== undefined && { source_url: input.sourceUrl }),
  };
}

function toUpdateRow(input: Partial<PriceObservationInput>): PriceObservationUpdate {
  return {
    ...(input.productId !== undefined && { product_id: input.productId }),
    ...(input.varietyId !== undefined && { variety_id: input.varietyId }),
    ...(input.administrativeAreaId !== undefined && { administrative_area_id: input.administrativeAreaId }),
    ...(input.marketName !== undefined && { market_name: input.marketName }),
    ...(input.observedOn !== undefined && { observed_on: input.observedOn }),
    ...(input.unitId !== undefined && { unit_id: input.unitId }),
    ...(input.currencyId !== undefined && { currency_id: input.currencyId }),
    ...(input.priceLow !== undefined && { price_low: input.priceLow }),
    ...(input.priceMid !== undefined && { price_mid: input.priceMid }),
    ...(input.priceHigh !== undefined && { price_high: input.priceHigh }),
    ...(input.sourceId !== undefined && { source_id: input.sourceId }),
    ...(input.sourceUrl !== undefined && { source_url: input.sourceUrl }),
  };
}

function idMap<T extends string | number>(rows: Array<{ id: T; code: string }>) {
  return new Map(rows.map((row) => [String(row.code).toUpperCase(), row.id]));
}

function requiredNumber(value: string, row: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`CSV row ${row} has an invalid price.`);
  return parsed;
}

function optionalNumber(value?: string) {
  return value ? requiredNumber(value, 0) : null;
}

function relationName(value: unknown): string | null {
  const relation = Array.isArray(value) ? value[0] : value;
  return relation && typeof relation === "object" && "name" in relation ? String(relation.name) : null;
}

function numberOrNull(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

async function audit(supabase: Awaited<ReturnType<typeof getAdminContext>>["supabase"], userId: string, action: string, entityId: string) {
  const { error } = await supabase.from("audit_logs").insert({ user_id: userId, action, entity_table: "market_price_observations", entity_id: entityId });
  if (error) throw new Error(`Operation succeeded but audit logging failed: ${error.message}`);
}
