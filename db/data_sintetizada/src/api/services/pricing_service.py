from __future__ import annotations

from dataclasses import dataclass

from src.api.infrastructure.settings import Settings


@dataclass(frozen=True)
class CostBreakdown:
    logistics_cost_per_kg: float
    commission_cost_per_kg: float
    handling_cost_per_kg: float
    estimated_loss_cost_per_kg: float


class PricingService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def calculate_farm_gate_price(self, *, predicted_wholesale_price_per_kg: float, logistics_cost_per_kg: float) -> tuple[float, CostBreakdown]:
        estimated_loss_cost = predicted_wholesale_price_per_kg * self._settings.estimated_loss_percentage
        farm_gate = predicted_wholesale_price_per_kg - logistics_cost_per_kg - self._settings.commission_cost_per_kg - self._settings.handling_cost_per_kg - estimated_loss_cost
        farm_gate = max(0.0, farm_gate)
        return (
            farm_gate,
            CostBreakdown(
                logistics_cost_per_kg=logistics_cost_per_kg,
                commission_cost_per_kg=self._settings.commission_cost_per_kg,
                handling_cost_per_kg=self._settings.handling_cost_per_kg,
                estimated_loss_cost_per_kg=estimated_loss_cost,
            ),
        )

    def calculate_quantity_analysis(
        self,
        *,
        quantity_kg: float,
        predicted_wholesale_price_per_kg: float,
        estimated_farm_gate_price_per_kg: float,
        lower_bound_per_kg: float,
        upper_bound_per_kg: float,
    ) -> dict[str, float]:
        return {
            "quantityKg": quantity_kg,
            "estimatedWholesaleRevenue": round(quantity_kg * predicted_wholesale_price_per_kg, 2),
            "estimatedFarmGateRevenue": round(quantity_kg * estimated_farm_gate_price_per_kg, 2),
            "lowerEstimatedRevenue": round(quantity_kg * lower_bound_per_kg, 2),
            "upperEstimatedRevenue": round(quantity_kg * upper_bound_per_kg, 2),
        }
