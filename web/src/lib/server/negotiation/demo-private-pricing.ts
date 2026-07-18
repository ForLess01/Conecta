import "server-only";

/**
 * Demo-only private pricing. This must stay in a server-only module until the
 * values are read through the authenticated `submit_quick_offer` RPC.
 */
const DEMO_PRIVATE_FLOOR_BY_OFFER_ID: Readonly<Record<string, number>> = {
  "prod-papa-canchan": 1.35,
  "prod-papa-imilla": 1.6,
  "prod-fibra-alpaca": 18.5,
  "prod-quinua": 6.2,
  "prod-cebolla": 0.95,
  "prod-trucha": 12.5,
};

export function getDemoPrivateFloorPrice(offerId: string): number | undefined {
  return DEMO_PRIVATE_FLOOR_BY_OFFER_ID[offerId];
}
