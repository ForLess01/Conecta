from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / '.env',
        env_file_encoding='utf-8',
        extra='ignore',
    )

    app_name: str = Field(default='Agro Price Prediction API', alias='APP_NAME')
    app_env: str = Field(default='development', alias='APP_ENV')
    app_version: str = Field(default='1.0.0', alias='APP_VERSION')
    api_prefix: str = Field(default='/api/v1', alias='API_PREFIX')

    database_url: str = Field(default='sqlite:///./agro_predictions.db', alias='DATABASE_URL')

    model_registry_path: str = Field(default='models/registry.json', alias='MODEL_REGISTRY_PATH')
    inference_dataset_path: str = Field(default='data/processed/inference_dataset.csv', alias='INFERENCE_DATASET_PATH')
    latest_predictions_path: str = Field(default='reports/predictions/latest_predictions.json', alias='LATEST_PREDICTIONS_PATH')

    model_cache_enabled: bool = Field(default=True, alias='MODEL_CACHE_ENABLED')
    cors_allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4200'],
        alias='CORS_ALLOWED_ORIGINS',
    )

    default_forecast_days: int = Field(default=7, alias='DEFAULT_FORECAST_DAYS')
    max_forecast_days: int = Field(default=30, alias='MAX_FORECAST_DAYS')

    commission_cost_per_kg: float = Field(default=0.10, alias='COMMISSION_COST_PER_KG')
    handling_cost_per_kg: float = Field(default=0.08, alias='HANDLING_COST_PER_KG')
    estimated_loss_percentage: float = Field(default=0.03, alias='ESTIMATED_LOSS_PERCENTAGE')

    unstable_market_threshold: float = Field(default=0.10, alias='UNSTABLE_MARKET_THRESHOLD')
    sell_threshold: float = Field(default=0.05, alias='SELL_THRESHOLD')
    wait_threshold: float = Field(default=-0.05, alias='WAIT_THRESHOLD')

    @field_validator('cors_allowed_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(',') if item.strip()]
        if isinstance(value, list):
            return value
        return []

    def resolve_path(self, raw_path: str) -> Path:
        path = Path(raw_path)
        return path if path.is_absolute() else PROJECT_ROOT / path


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
