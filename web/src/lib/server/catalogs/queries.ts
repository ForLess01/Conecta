import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface CatalogProduct {
  id: string;
  name: string;
  defaultUnitId: number;
  varieties: { id: string; name: string }[];
}

export interface CatalogUnit {
  id: number;
  name: string;
  symbol: string;
}

export async function getMarketplaceCatalogs() {
  const supabase = await createClient();
  const [productsResult, varietiesResult, unitsResult] = await Promise.all([
    supabase.from("products").select("id,name,default_unit_id").eq("is_active", true).order("name"),
    supabase.from("product_varieties").select("id,name,product_id").eq("is_active", true).order("name"),
    supabase.from("units_of_measure").select("id,name,symbol").order("name"),
  ]);
  const error = productsResult.error ?? varietiesResult.error ?? unitsResult.error;
  if (error) throw new Error(`No se pudieron cargar los catálogos: ${error.message}`);

  const varieties = varietiesResult.data ?? [];
  return {
    products: (productsResult.data ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      defaultUnitId: product.default_unit_id,
      varieties: varieties
        .filter((variety) => variety.product_id === product.id)
        .map((variety) => ({ id: variety.id, name: variety.name })),
    })) satisfies CatalogProduct[],
    units: (unitsResult.data ?? []).map((unit) => ({ id: unit.id, name: unit.name, symbol: unit.symbol })) satisfies CatalogUnit[],
  };
}
