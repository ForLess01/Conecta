import type { Order } from "@/types/domain";

export const ORDERS: Order[] = [
  {
    id: "order-1",
    buyerId: "buyer-2",
    productId: "prod-papa-canchan",
    allocations: [
      { producerId: "prod-1", quantity: 4200, pricePerUnit: 1.55, distanceKm: 118, risk: "medio" },
    ],
    total: 6510,
    status: "en_transito",
    logisticsMode: "marketplace_flete",
    createdAt: "2026-07-17T10:00:00-05:00",
    timeline: [
      { label: "Match confirmado", at: "2026-07-17T10:00:00-05:00", done: true },
      { label: "Logística seleccionada", at: "2026-07-17T11:30:00-05:00", done: true },
      { label: "Transportista asignado", at: "2026-07-17T15:00:00-05:00", done: true },
      { label: "En tránsito", at: "2026-07-18T06:45:00-05:00", done: true },
      { label: "Entregado", at: "", done: false },
    ],
  },
  {
    id: "order-2",
    buyerId: "buyer-1",
    productId: "prod-trucha",
    allocations: [
      { producerId: "prod-4", quantity: 300, pricePerUnit: 14, distanceKm: 82, risk: "medio" },
    ],
    total: 4200,
    status: "pendiente_logistica",
    createdAt: "2026-07-18T08:00:00-05:00",
    timeline: [
      { label: "Match confirmado", at: "2026-07-18T08:00:00-05:00", done: true },
      { label: "Logística seleccionada", at: "", done: false },
      { label: "Transportista asignado", at: "", done: false },
      { label: "En tránsito", at: "", done: false },
      { label: "Entregado", at: "", done: false },
    ],
  },
];

export function getOrderById(id: string): Order | undefined {
  return ORDERS.find((o) => o.id === id);
}
