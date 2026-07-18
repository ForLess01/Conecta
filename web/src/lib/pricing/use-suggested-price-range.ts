"use client";

import { useEffect, useState } from "react";
import type { ProductCategory } from "@/types/domain";

export interface SuggestedPriceRange {
  low: number;
  central: number;
  high: number;
  unit: string;
  confidence: number;
  confidenceLabel: string;
  basis: string;
}

/**
 * Fetches the price reference for a category (S3-01's real weighted-median
 * algorithm isn't wired yet; today this is a demo estimate). Always a hint —
 * never required, never blocks the form (S3-02).
 */
export function useSuggestedPriceRange(category: ProductCategory): SuggestedPriceRange | null {
  const [result, setResult] = useState<{
    category: ProductCategory;
    suggestion: SuggestedPriceRange | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/pricing/suggested-range?category=${category}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setResult({ category, suggestion: data });
      })
      .catch(() => {
        if (!cancelled) setResult({ category, suggestion: null });
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  return result?.category === category ? result.suggestion : null;
}
