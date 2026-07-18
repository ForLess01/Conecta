import "server-only";

import { PRODUCTS, getProductById } from "@/lib/mock/products";
import type { ProductCategory } from "@/types/domain";

export type ConfidenceLabel = "referencia preliminar" | "referencia moderada" | "referencia sólida";

export interface PriceSuggestion {
  low: number;
  central: number;
  high: number;
  unit: string;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  updatedAt: string;
  basis: string;
}

export interface PricingAdapter {
  getSuggestedRangeForOffer(offerListingId: string): Promise<PriceSuggestion | null>;
  getSuggestedRangeForCategory(category: ProductCategory): Promise<PriceSuggestion | null>;
}

export class PricingServerConfigurationError extends Error {}

// S3-01 (median ponderada sobre datos históricos) no está implementado
// todavía; hasta entonces esta es una referencia de demo, nunca un precio
// obligatorio (S3-02: "el precio sigue siendo editable y no obligatorio").
export function labelForConfidence(confidence: number): ConfidenceLabel {
  if (confidence < 40) return "referencia preliminar";
  if (confidence < 70) return "referencia moderada";
  return "referencia sólida";
}

const demoAdapter: PricingAdapter = {
  async getSuggestedRangeForOffer(offerListingId) {
    const product = getProductById(offerListingId);
    if (!product) return null;
    const { priceRange } = product;
    return {
      low: priceRange.low,
      central: priceRange.central,
      high: priceRange.high,
      unit: priceRange.unit,
      confidence: priceRange.confidence,
      confidenceLabel: labelForConfidence(priceRange.confidence),
      updatedAt: priceRange.updatedAt,
      basis: `Basado en la publicación de ${product.name}.`,
    };
  },

  async getSuggestedRangeForCategory(category) {
    const comparable = PRODUCTS.filter((product) => product.category === category);
    if (comparable.length === 0) return null;

    const average = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
    const low = average(comparable.map((p) => p.priceRange.low));
    const central = average(comparable.map((p) => p.priceRange.central));
    const high = average(comparable.map((p) => p.priceRange.high));
    // A category-wide estimate is less precise than one tied to a specific
    // listing, so its confidence is capped below any individual observation.
    const confidence = Math.max(
      0,
      Math.round(average(comparable.map((p) => p.priceRange.confidence)) - 15),
    );

    return {
      low,
      central,
      high,
      unit: comparable[0].priceRange.unit,
      confidence,
      confidenceLabel: labelForConfidence(confidence),
      updatedAt: new Date().toISOString(),
      basis: `Promedio de ${comparable.length} publicaciones comparables de esta categoría.`,
    };
  },
};

function resolveAdapter(adapter?: PricingAdapter): PricingAdapter {
  if (adapter) return adapter;
  if (process.env.NODE_ENV === "production") {
    throw new PricingServerConfigurationError(
      "Price suggestions require the real pricing service (S3-01) in production",
    );
  }
  return demoAdapter;
}

export async function getSuggestedRangeForOffer(
  offerListingId: string,
  adapter?: PricingAdapter,
): Promise<PriceSuggestion | null> {
  return resolveAdapter(adapter).getSuggestedRangeForOffer(offerListingId);
}

export async function getSuggestedRangeForCategory(
  category: ProductCategory,
  adapter?: PricingAdapter,
): Promise<PriceSuggestion | null> {
  return resolveAdapter(adapter).getSuggestedRangeForCategory(category);
}
