import type { Product } from "@/types/domain";

export const MAX_QUICK_OFFER_ATTEMPTS = 3;
export const RESERVATION_MINUTES = 15;

export type QuickOfferResult =
  | { accepted: true; reservationMinutes: number }
  | { accepted: false; attemptsRemaining: number };

/**
 * Evaluates a quick offer against the product's hidden floor price.
 * The hidden floor price and any gap to it must NEVER be surfaced to the
 * client, in UI copy, logs, or network responses. This function is the only
 * place that reads `hiddenFloorPrice`; callers only receive accepted/rejected.
 */
export function evaluateQuickOffer(params: {
  product: Product;
  offeredPricePerUnit: number;
  attemptNumber: number;
}): QuickOfferResult {
  const { product, offeredPricePerUnit, attemptNumber } = params;
  const accepted = offeredPricePerUnit >= product.hiddenFloorPrice;

  if (accepted) {
    return { accepted: true, reservationMinutes: RESERVATION_MINUTES };
  }

  const attemptsRemaining = Math.max(0, MAX_QUICK_OFFER_ATTEMPTS - attemptNumber);
  return { accepted: false, attemptsRemaining };
}
