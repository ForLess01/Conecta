from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field


REQUIRED_FILES = {
    "products": "products.csv",
    "market_prices": "market_prices.csv",
    "weather_daily": "weather_daily.csv",
    "crop_production_monthly": "crop_production_monthly.csv",
    "logistics_costs": "logistics_costs.csv",
}

REQUIRED_COLUMNS = {
    "products": [
        "product_id",
        "product_name",
        "variety",
        "standard_unit",
        "currency",
        "origin_department",
        "origin_province",
        "is_synthetic",
    ],
    "market_prices": [
        "date",
        "product",
        "variety",
        "origin_department",
        "origin_province",
        "market",
        "market_city",
        "min_price_per_kg",
        "avg_price_per_kg",
        "max_price_per_kg",
        "volume_kg",
        "source",
        "is_synthetic",
        "generated_at",
    ],
    "weather_daily": [
        "date",
        "department",
        "province",
        "district",
        "latitude",
        "longitude",
        "temp_min_c",
        "temp_max_c",
        "temp_avg_c",
        "precipitation_mm",
        "humidity_avg",
        "wind_speed_kmh",
        "source",
        "is_synthetic",
        "generated_at",
    ],
    "crop_production_monthly": [
        "year",
        "month",
        "product",
        "variety",
        "department",
        "province",
        "planted_area_ha",
        "harvested_area_ha",
        "production_tons",
        "yield_tons_per_ha",
        "source",
        "is_synthetic",
        "generated_at",
    ],
    "logistics_costs": [
        "origin_department",
        "origin_province",
        "destination_city",
        "distance_km",
        "vehicle_type",
        "max_capacity_kg",
        "total_transport_cost",
        "cost_per_kg",
        "valid_from",
        "valid_to",
        "fuel_price_index",
        "source",
        "is_synthetic",
        "generated_at",
    ],
}

DUPLICATE_KEYS = {
    "market_prices": ["date", "product", "variety", "origin_department", "origin_province", "market"],
    "weather_daily": ["date", "department", "province"],
    "crop_production_monthly": ["year", "month", "product", "variety", "department", "province"],
    "logistics_costs": ["origin_department", "origin_province", "destination_city", "valid_from"],
}

DATE_COLUMNS = {
    "market_prices": ["date", "generated_at"],
    "weather_daily": ["date", "generated_at"],
    "logistics_costs": ["valid_from", "valid_to", "generated_at"],
}

NUMERIC_COLUMNS = {
    "market_prices": ["min_price_per_kg", "avg_price_per_kg", "max_price_per_kg", "volume_kg"],
    "weather_daily": ["latitude", "longitude", "temp_min_c", "temp_max_c", "temp_avg_c", "precipitation_mm", "humidity_avg", "wind_speed_kmh"],
    "crop_production_monthly": ["year", "month", "planted_area_ha", "harvested_area_ha", "production_tons", "yield_tons_per_ha"],
    "logistics_costs": ["distance_km", "max_capacity_kg", "total_transport_cost", "cost_per_kg", "fuel_price_index"],
}

REQUIRED_MARKET_FIELDS = ["date", "product", "variety", "origin_department", "origin_province", "market", "avg_price_per_kg"]

OPTIONAL_NUMERIC_IMPUTATION = {
    "market_prices": ["min_price_per_kg", "max_price_per_kg", "volume_kg"],
    "weather_daily": ["temp_min_c", "temp_max_c", "temp_avg_c", "precipitation_mm", "humidity_avg", "wind_speed_kmh"],
    "crop_production_monthly": ["planted_area_ha", "harvested_area_ha", "production_tons", "yield_tons_per_ha"],
    "logistics_costs": ["distance_km", "max_capacity_kg", "total_transport_cost", "cost_per_kg", "fuel_price_index"],
}

ALIAS_CONFIG_PATH = Path("config/normalization_aliases.json")
PRODUCT_CONFIG_PATH = Path("config/products.json")


class ETLPaths(BaseModel):
    input_dir: Path = Field(default=Path("data/raw"))
    output_dir: Path = Field(default=Path("data/processed"))
    overwrite: bool = Field(default=False)
    alias_config_path: Path = Field(default=ALIAS_CONFIG_PATH)
    product_config_path: Path = Field(default=PRODUCT_CONFIG_PATH)


class ETLSettings(BaseModel):
    paths: ETLPaths = Field(default_factory=ETLPaths)
    max_invalid_date_ratio: float = 0.05


def load_aliases(path: Path) -> dict[str, dict[str, str]]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    aliases: dict[str, dict[str, str]] = {}
    for key, mapping in payload.items():
        aliases[key] = {str(alias).strip().lower(): str(value) for alias, value in mapping.items()}
    return aliases


def load_product_reference(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    return payload["products"]
