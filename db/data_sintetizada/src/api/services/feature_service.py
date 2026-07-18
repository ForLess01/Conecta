from __future__ import annotations

from src.api.exception_handlers import ApiError
from src.api.repositories.feature_repository import FeatureRepository

from .model_registry_service import ModelRegistryService


class FeatureService:
    def __init__(self, feature_repository: FeatureRepository, model_registry_service: ModelRegistryService) -> None:
        self._feature_repository = feature_repository
        self._model_registry_service = model_registry_service

    def get_latest_features(
        self,
        *,
        product: str,
        variety: str | None,
        origin_department: str | None = None,
        origin_province: str | None = None,
        market: str | None = None,
        destination_city: str | None = None,
    ):
        row = self._feature_repository.latest_row_for_filters(
            product=product,
            variety=variety,
            origin_department=origin_department,
            origin_province=origin_province,
            market=market,
            destination_city=destination_city,
            allowed_keys=self._model_registry_service.allowed_product_keys(),
        )
        if row is None:
            raise ApiError(
                code="PRODUCT_NOT_FOUND",
                message="No data is available for the requested product filters.",
                status_code=404,
            )
        return row
