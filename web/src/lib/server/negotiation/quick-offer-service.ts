import "server-only";

import { randomUUID } from "node:crypto";
import { getProductById } from "@/lib/mock/products";
import {
  MAX_QUICK_OFFER_ATTEMPTS,
  RESERVATION_MINUTES,
  type QuickOfferResponse,
  type QuickOfferStatus,
} from "@/lib/negotiation/quick-offer";
import { getDemoPrivateFloorPrice } from "./demo-private-pricing";

export interface QuickOfferCommand {
  offerListingId: string;
  buyerActorId?: string;
  quantity: number;
  unitPrice: number;
  currencyCode: "PEN";
  attemptKey: string;
}

export interface QuickOfferAdapter {
  submit(command: QuickOfferCommand): Promise<QuickOfferResponse>;
}

type SubmitQuickOfferRpcRow = {
  result: QuickOfferStatus;
  order_id: string | null;
  negotiation_id: string | null;
  attempts_remaining: number;
  reservation_expires_at: string | null;
};

type SubmitQuickOfferRpc = (
  functionName: "submit_quick_offer",
  args: {
    p_offer_listing_id: string;
    p_buyer_actor_id: string;
    p_quantity: number;
    p_unit_price: number;
    p_currency_code: "PEN";
  }
) => Promise<SubmitQuickOfferRpcRow>;

/**
 * Narrow server-side seam for the existing SQL RPC. The caller must provide
 * an authenticated actor ID and an RPC function created with server-side auth;
 * this module deliberately creates neither browser nor service-role clients.
 */
export function createSubmitQuickOfferRpcAdapter(rpc: SubmitQuickOfferRpc): QuickOfferAdapter {
  return {
    async submit(command) {
      if (!command.buyerActorId) {
        throw new Error("An authenticated buyer actor is required for submit_quick_offer");
      }

      const row = await rpc("submit_quick_offer", {
        p_offer_listing_id: command.offerListingId,
        p_buyer_actor_id: command.buyerActorId,
        p_quantity: command.quantity,
        p_unit_price: command.unitPrice,
        p_currency_code: command.currencyCode,
      });

      return toPublicResponse(row);
    },
  };
}

type AttemptState = Map<string, number>;

// Demo-only compromise: session identities are not authentication. A second,
// process-wide ceiling prevents clearing a cookie from yielding unlimited floor
// probes while still allowing a few local demo sessions per listing.
const DEMO_PROCESS_ATTEMPTS_PER_OFFER = MAX_QUICK_OFFER_ATTEMPTS * 4;

const globalAttemptState = globalThis as typeof globalThis & {
  conectaQuickOfferAttempts?: AttemptState;
  conectaQuickOfferAttemptsByOffer?: AttemptState;
};

const attempts =
  globalAttemptState.conectaQuickOfferAttempts ??
  (globalAttemptState.conectaQuickOfferAttempts = new Map<string, number>());
const attemptsByOffer =
  globalAttemptState.conectaQuickOfferAttemptsByOffer ??
  (globalAttemptState.conectaQuickOfferAttemptsByOffer = new Map<string, number>());

const demoAdapter: QuickOfferAdapter = {
  async submit(command) {
    const product = getProductById(command.offerListingId);
    const floorPrice = getDemoPrivateFloorPrice(command.offerListingId);

    if (!product || !product.quickOfferEnabled || floorPrice === undefined) {
      return unavailable();
    }

    const attemptStateKey = `${command.attemptKey}:${command.offerListingId}`;
    const attemptsUsed = attempts.get(attemptStateKey) ?? 0;
    const offerAttemptsUsed = attemptsByOffer.get(command.offerListingId) ?? 0;

    if (
      attemptsUsed >= MAX_QUICK_OFFER_ATTEMPTS
      || offerAttemptsUsed >= DEMO_PROCESS_ATTEMPTS_PER_OFFER
    ) {
      return {
        accepted: false,
        status: "RATE_LIMITED",
        attemptsRemaining: 0,
        reservationExpiresAt: null,
        orderId: null,
        negotiationId: null,
      };
    }

    const attemptsAfterSubmission = attemptsUsed + 1;
    const offerAttemptsAfterSubmission = offerAttemptsUsed + 1;
    const attemptsRemaining = Math.max(
      0,
      Math.min(
        MAX_QUICK_OFFER_ATTEMPTS - attemptsAfterSubmission,
        DEMO_PROCESS_ATTEMPTS_PER_OFFER - offerAttemptsAfterSubmission,
      ),
    );

    attempts.set(attemptStateKey, attemptsAfterSubmission);
    attemptsByOffer.set(command.offerListingId, offerAttemptsAfterSubmission);

    if (
      command.quantity < product.minOrder ||
      command.quantity > product.quantityAvailable
    ) {
      return {
        accepted: false,
        status: "UNAVAILABLE",
        attemptsRemaining,
        reservationExpiresAt: null,
        orderId: null,
        negotiationId: null,
      };
    }

    if (command.unitPrice < floorPrice) {
      return {
        accepted: false,
        status: "NOT_ACCEPTED",
        attemptsRemaining,
        reservationExpiresAt: null,
        orderId: null,
        negotiationId: null,
      };
    }

    const now = Date.now();

    return {
      accepted: true,
      status: "AUTO_ACCEPTED",
      attemptsRemaining,
      reservationExpiresAt: new Date(now + RESERVATION_MINUTES * 60_000).toISOString(),
      orderId: `demo-order-${randomUUID()}`,
      negotiationId: `demo-negotiation-${randomUUID()}`,
    };
  },
};

export class QuickOfferServerConfigurationError extends Error {}

export async function submitQuickOffer(
  command: QuickOfferCommand,
  adapter?: QuickOfferAdapter,
): Promise<QuickOfferResponse> {
  if (adapter) {
    if (!command.buyerActorId) {
      throw new QuickOfferServerConfigurationError(
        "An authenticated buyer actor is required with a quick-offer RPC adapter",
      );
    }
    return adapter.submit(command);
  }

  if (process.env.NODE_ENV === "production") {
    throw new QuickOfferServerConfigurationError(
      "Quick offers require an authenticated RPC adapter in production",
    );
  }

  return demoAdapter.submit(command);
}

export function clearDemoQuickOfferAttempts(): void {
  attempts.clear();
  attemptsByOffer.clear();
}

function unavailable(): QuickOfferResponse {
  return {
    accepted: false,
    status: "UNAVAILABLE",
    attemptsRemaining: 0,
    reservationExpiresAt: null,
    orderId: null,
    negotiationId: null,
  };
}

function toPublicResponse(row: SubmitQuickOfferRpcRow): QuickOfferResponse {
  return {
    accepted: row.result === "AUTO_ACCEPTED",
    status: row.result,
    attemptsRemaining: row.attempts_remaining,
    reservationExpiresAt: row.reservation_expires_at,
    orderId: row.order_id,
    negotiationId: row.negotiation_id,
  };
}
