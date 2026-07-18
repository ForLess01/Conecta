from __future__ import annotations

from src.api.repositories.product_repository import ProductRepository

from .feature_service import FeatureService
from .model_registry_service import ModelRegistryService


class ProductService:
    def __init__(self, product_repository: ProductRepository, feature_service: FeatureService, model_registry_service: ModelRegistryService) -> None:
        self._product_repository = product_repository
        self._feature_service = feature_service
        self._model_registry_service = model_registry_service

    def list_products(self) -> list[dict]:
        rows = self._product_repository.list_available_products(self._model_registry_service.allowed_product_keys())
        items = []
        for _, row in rows.iterrows():
            items.append(
                {
                    "product": row["product"],
                    "variety": row["variety"],
                    "originDepartment": row["origin_department"],
                    "originProvince": row["origin_province"],
                    "destinationMarket": row["market"],
                    "destinationCity": row["market_city"],
                    "modelAvailable": True,
                }
            )
        return items

    def get_latest_observation(self, *, product: str, variety: str | None, origin_department: str | None, origin_province: str | None, market: str | None):
        row = self._feature_service.get_latest_features(
            product=product,
            variety=variety,
            origin_department=origin_department,
            origin_province=origin_province,
            market=market,
        )
        return {
            "product": row["product"],
            "variety": row["variety"],
            "date": row["date"].date().isoformat(),
            "origin": {"department": row["origin_department"], "province": row["origin_province"]},
            "destination": {"market": row["market"], "city": row["market_city"]},
            "lastObservedPricePerKg": float(row["avg_price_per_kg"]),
            "minimumObservedPricePerKg": float(row["min_price_per_kg"]),
            "maximumObservedPricePerKg": float(row["max_price_per_kg"]),
            "rollingMean7": float(row["price_rolling_mean_7"]),
            "rollingMean30": float(row["price_rolling_mean_30"]),
            "volumeKg": float(row["volume_kg"]),
            "logisticsCostPerKg": float(row["cost_per_kg"]),
            "syntheticData": True,
        }
