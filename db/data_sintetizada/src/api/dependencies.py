from __future__ import annotations

from functools import lru_cache

from fastapi import Depends
from sqlalchemy.orm import Session

from .infrastructure.database import get_db_session
from .infrastructure.model_cache import ModelCache
from .infrastructure.settings import Settings, get_settings
from .repositories.feature_repository import FeatureRepository
from .repositories.prediction_repository import PredictionRepository
from .repositories.product_repository import ProductRepository
from .services.feature_service import FeatureService
from .services.model_registry_service import ModelRegistryService
from .services.prediction_service import PredictionService
from .services.pricing_service import PricingService
from .services.product_service import ProductService
from .services.recommendation_service import RecommendationService


@lru_cache(maxsize=1)
def get_model_cache() -> ModelCache:
    settings = get_settings()
    return ModelCache(models_root=settings.resolve_path("models"), enabled=settings.model_cache_enabled)


@lru_cache(maxsize=1)
def get_feature_repository() -> FeatureRepository:
    settings = get_settings()
    return FeatureRepository(dataset_path=settings.resolve_path(settings.inference_dataset_path))


@lru_cache(maxsize=1)
def get_model_registry_service() -> ModelRegistryService:
    settings = get_settings()
    return ModelRegistryService(
        registry_path=settings.resolve_path(settings.model_registry_path),
        models_root=settings.resolve_path("models"),
    )


@lru_cache(maxsize=1)
def get_product_repository() -> ProductRepository:
    return ProductRepository(feature_repository=get_feature_repository())


def get_prediction_repository(session: Session = Depends(get_db_session)) -> PredictionRepository:
    return PredictionRepository(session)


@lru_cache(maxsize=1)
def get_pricing_service() -> PricingService:
    return PricingService(get_settings())


@lru_cache(maxsize=1)
def get_recommendation_service() -> RecommendationService:
    return RecommendationService(get_settings())


@lru_cache(maxsize=1)
def get_feature_service() -> FeatureService:
    return FeatureService(feature_repository=get_feature_repository(), model_registry_service=get_model_registry_service())


@lru_cache(maxsize=1)
def get_product_service() -> ProductService:
    return ProductService(
        product_repository=get_product_repository(),
        feature_service=get_feature_service(),
        model_registry_service=get_model_registry_service(),
    )


def get_prediction_service(
    prediction_repository: PredictionRepository = Depends(get_prediction_repository),
    settings: Settings = Depends(get_settings),
) -> PredictionService:
    return PredictionService(
        settings=settings,
        feature_service=get_feature_service(),
        model_registry_service=get_model_registry_service(),
        recommendation_service=get_recommendation_service(),
        pricing_service=get_pricing_service(),
        prediction_repository=prediction_repository,
        model_cache=get_model_cache(),
    )
