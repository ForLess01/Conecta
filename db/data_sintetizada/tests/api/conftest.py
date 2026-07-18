from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.api.dependencies import (
    get_feature_repository,
    get_model_cache,
    get_model_registry_service,
    get_product_repository,
    get_product_service,
    get_pricing_service,
    get_recommendation_service,
)
from src.api.infrastructure import database as database_module
from src.api.infrastructure.database import Base
from src.api.infrastructure.settings import get_settings


@pytest.fixture(scope="session", autouse=True)
def test_environment() -> None:
    root = Path(__file__).resolve().parents[2]
    os.environ["DATABASE_URL"] = f"sqlite:///{(root / 'test_api.db').as_posix()}"
    os.environ["MODEL_REGISTRY_PATH"] = "models/registry.json"
    os.environ["INFERENCE_DATASET_PATH"] = "data/processed/inference_dataset.csv"
    os.environ["LATEST_PREDICTIONS_PATH"] = "reports/predictions/latest_predictions.json"
    os.environ["CORS_ALLOWED_ORIGINS"] = "http://localhost:3000,http://localhost:5173,http://localhost:4200"

    get_settings.cache_clear()
    get_feature_repository.cache_clear()
    get_model_registry_service.cache_clear()
    get_model_cache.cache_clear()
    get_product_repository.cache_clear()
    get_product_service.cache_clear()
    get_pricing_service.cache_clear()
    get_recommendation_service.cache_clear()
    database_module._engine = None
    database_module._SessionLocal = None


@pytest.fixture(autouse=True)
def reset_database(test_environment) -> None:
    engine = database_module.get_engine()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def client(test_environment) -> TestClient:
    from src.api.main import app

    app.dependency_overrides.clear()
    return TestClient(app)


@pytest.fixture()
def forecast_payload() -> dict:
    return {
        "product": "Granada",
        "variety": "Wonderful",
        "originDepartment": "Ica",
        "originProvince": "Ica",
        "destinationMarket": "Mercado Mayorista de Frutas",
        "destinationCity": "Lima",
        "forecastDays": 7,
        "quantityKg": 1000,
    }
