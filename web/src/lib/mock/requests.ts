import type { PurchaseRequest } from "@/types/domain";
import { LOCATIONS } from "./locations";

export const PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    id: "req-1",
    buyerId: "buyer-2",
    category: "papa",
    productName: "Papa Canchán o Imilla",
    volume: 6000,
    unit: "kg",
    quality: "Primera calidad, calibre medio-grande",
    deadline: "2026-07-28",
    destination: LOCATIONS.juliaca,
    initialPrice: 1.5,
    acceptsPartial: true,
    acceptsMultipleProducers: true,
    coveredQuantity: 2200,
    proposalsCount: 3,
    logisticsPreference: "Buscar transporte en marketplace",
  },
  {
    id: "req-2",
    buyerId: "buyer-3",
    category: "fibra_alpaca",
    productName: "Fibra de alpaca Huacaya",
    volume: 400,
    unit: "kg",
    quality: "Finura menor a 23 micras",
    deadline: "2026-08-05",
    destination: LOCATIONS.puno,
    acceptsPartial: false,
    acceptsMultipleProducers: false,
    coveredQuantity: 0,
    proposalsCount: 1,
    logisticsPreference: "Entrega del productor",
  },
  {
    id: "req-3",
    buyerId: "buyer-1",
    category: "trucha",
    productName: "Trucha fresca eviscerada",
    volume: 300,
    unit: "kg",
    quality: "Tamaño 300-400 g",
    deadline: "2026-07-22",
    destination: LOCATIONS.arequipa,
    initialPrice: 13.5,
    acceptsPartial: true,
    acceptsMultipleProducers: true,
    coveredQuantity: 150,
    proposalsCount: 2,
    logisticsPreference: "Buscar transporte en marketplace",
  },
];

export function getRequestById(id: string): PurchaseRequest | undefined {
  return PURCHASE_REQUESTS.find((r) => r.id === id);
}
