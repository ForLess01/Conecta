from __future__ import annotations

from src.api.infrastructure.settings import Settings


class RecommendationService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def build_recommendation(self, *, predicted_price: float, rolling_mean_7: float, rolling_std_7: float) -> tuple[str, float]:
        change = 0.0 if abs(rolling_mean_7) < 1e-8 else (predicted_price - rolling_mean_7) / rolling_mean_7
        if rolling_mean_7 > 0 and (rolling_std_7 / rolling_mean_7) >= self._settings.unstable_market_threshold:
            return "MERCADO_INESTABLE", change
        if change >= self._settings.sell_threshold:
            return "VENDER", change
        if change <= self._settings.wait_threshold:
            return "ESPERAR", change
        return "MANTENER", change

    def confidence_label(self, *, predicted_price: float, lower_bound: float, upper_bound: float) -> tuple[float, str]:
        if predicted_price <= 0:
            return 0.9, "BAJA"
        relative_interval_width = (upper_bound - lower_bound) / predicted_price
        if relative_interval_width <= 0.10:
            return 0.9, "ALTA"
        if relative_interval_width <= 0.20:
            return 0.9, "MEDIA"
        return 0.9, "BAJA"
