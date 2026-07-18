import type { OperationsAnalytics } from "./operations";

export function analyticsToCsv(analytics: OperationsAnalytics): string {
  const rows = [
    ["metric", "value"],
    ["range_days", analytics.rangeDays],
    ["generated_at", analytics.generatedAt],
    ["negotiations_per_day", analytics.negotiationsPerDay],
    ["average_negotiation_hours", analytics.averageNegotiationHours ?? ""],
    ["completed_orders", analytics.completedOrders],
    ["marketplace_transport_percent", analytics.marketplaceTransportPercent],
    ["average_risk_severity", analytics.averageRiskSeverity ?? ""],
    ["price_observations", analytics.priceObservations],
    ...analytics.topProducts.map((item) => [`top_product:${item.name}`, item.quantity]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
