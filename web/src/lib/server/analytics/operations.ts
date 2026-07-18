import "server-only";

import { getAdminContext } from "@/lib/server/admin/auth";
export { analyticsToCsv } from "./export";

export interface OperationsAnalytics {
  rangeDays: number;
  generatedAt: string;
  negotiationsPerDay: number;
  averageNegotiationHours: number | null;
  completedOrders: number;
  marketplaceTransportPercent: number;
  averageRiskSeverity: number | null;
  priceObservations: number;
  topProducts: Array<{ name: string; quantity: number }>;
}

export async function getOperationsAnalytics(rangeDays: number): Promise<OperationsAnalytics> {
  const { supabase } = await getAdminContext();
  const since = new Date(Date.now() - rangeDays * 86_400_000).toISOString();
  const [negotiations, orders, shipments, risks, prices, orderItems] = await Promise.all([
    supabase.from("negotiations").select("created_at,updated_at,status").gte("created_at", since),
    supabase.from("commercial_orders").select("id,status").gte("created_at", since),
    supabase.from("shipment_requests").select("order_id").gte("created_at", since),
    supabase.from("risk_events").select("severity").gte("created_at", since),
    supabase.from("market_price_observations").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("order_items").select("quantity,products(name),commercial_orders!inner(created_at)").gte("commercial_orders.created_at", since),
  ]);
  const failed = [negotiations, orders, shipments, risks, prices, orderItems].find((result) => result.error);
  if (failed?.error) throw new Error(`Could not load analytics: ${failed.error.message}`);

  const terminalNegotiations = (negotiations.data ?? []).filter((item) => ["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED", "AUTO_ACCEPTED", "NOT_ACCEPTED"].includes(item.status));
  const averageNegotiationHours = average(terminalNegotiations.map((item) => (Date.parse(item.updated_at) - Date.parse(item.created_at)) / 3_600_000));
  const orderIds = new Set((orders.data ?? []).map((item) => item.id));
  const orderIdsWithShipment = new Set(
    (shipments.data ?? []).map((item) => item.order_id).filter((id): id is string => Boolean(id && orderIds.has(id))),
  );
  const productTotals = new Map<string, number>();
  for (const item of orderItems.data ?? []) {
    const product = relationName(item.products) ?? "Producto";
    productTotals.set(product, (productTotals.get(product) ?? 0) + Number(item.quantity));
  }

  return {
    rangeDays,
    generatedAt: new Date().toISOString(),
    negotiationsPerDay: round((negotiations.data?.length ?? 0) / rangeDays),
    averageNegotiationHours: averageNegotiationHours === null ? null : round(averageNegotiationHours),
    completedOrders: (orders.data ?? []).filter((item) => item.status === "COMPLETED").length,
    marketplaceTransportPercent: orders.data?.length ? Math.round((orderIdsWithShipment.size / orders.data.length) * 100) : 0,
    averageRiskSeverity: average((risks.data ?? []).map((item) => Number(item.severity))),
    priceObservations: prices.count ?? 0,
    topProducts: [...productTotals.entries()].map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
  };
}

function average(values: number[]): number | null {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function relationName(value: unknown): string | null {
  const relation = Array.isArray(value) ? value[0] : value;
  return relation && typeof relation === "object" && "name" in relation ? String(relation.name) : null;
}
