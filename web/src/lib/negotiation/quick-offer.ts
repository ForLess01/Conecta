export const MAX_QUICK_OFFER_ATTEMPTS = 3;
export const RESERVATION_MINUTES = 15;

export type QuickOfferStatus =
  | "AUTO_ACCEPTED"
  | "NOT_ACCEPTED"
  | "UNAVAILABLE"
  | "RATE_LIMITED";

/** Public DTO. Private prices and comparison details must never be added here. */
export interface QuickOfferResponse {
  accepted: boolean;
  status: QuickOfferStatus;
  attemptsRemaining: number;
  reservationExpiresAt: string | null;
  orderId: string | null;
  negotiationId: string | null;
}
