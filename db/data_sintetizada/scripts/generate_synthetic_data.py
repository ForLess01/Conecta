from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

RANDOM_SEED = 42
GENERATOR_VERSION = "1.1.0"
SOURCE_NAME = "SYNTHETIC_GENERATOR"
CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "products.json"
STANDARD_UNIT = "kg"
CURRENCY = "PEN"

CLIMATE_PROFILES = {
    "coastal_arid": {"base_avg": 22.5, "amp": 3.0, "low": 6.4, "high": 7.6, "rain_p": 0.08, "rain_s": 0.35, "hum": 62.0, "hum_amp": 6.5, "wind": 13.0},
    "coastal_warm": {"base_avg": 24.3, "amp": 2.6, "low": 5.8, "high": 7.2, "rain_p": 0.12, "rain_s": 0.45, "hum": 68.0, "hum_amp": 7.0, "wind": 11.5},
    "highland_temperate": {"base_avg": 13.7, "amp": 3.6, "low": 5.4, "high": 8.3, "rain_p": 0.22, "rain_s": 1.15, "hum": 64.0, "hum_amp": 8.5, "wind": 10.0},
    "highland_cold": {"base_avg": 9.8, "amp": 4.1, "low": 6.6, "high": 7.8, "rain_p": 0.26, "rain_s": 1.35, "hum": 60.0, "hum_amp": 9.0, "wind": 12.5},
    "arid_highland": {"base_avg": 15.4, "amp": 3.4, "low": 6.0, "high": 8.0, "rain_p": 0.11, "rain_s": 0.55, "hum": 54.0, "hum_amp": 7.2, "wind": 14.0},
}


class GenerationConfig:
    def __init__(self, start_date: str, end_date: str, seed: int, overwrite: bool = False) -> None:
        self.start_date = start_date
        self.end_date = end_date
        self.seed = seed
        self.overwrite = overwrite


def _rng(seed: int, salt: int = 0) -> np.random.Generator:
    return np.random.default_rng(seed + salt)


def _timestamp() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _stable_generated_at(end_date: str) -> str:
    return f"{end_date}T00:00:00Z"


def _date_range(start_date: str, end_date: str) -> pd.DatetimeIndex:
    dates = pd.date_range(start=start_date, end=end_date, freq="D")
    if dates.empty:
        raise ValueError("Date range is empty.")
    return dates


def _month_range(start_date: str, end_date: str) -> pd.DatetimeIndex:
    months = pd.date_range(start=start_date, end=end_date, freq="MS")
    if months.empty:
        raise ValueError("Monthly range is empty.")
    return months


def _clip_round(series: pd.Series, lower: float, upper: float | None = None, decimals: int = 2) -> pd.Series:
    out = series.clip(lower=lower)
    if upper is not None:
        out = out.clip(upper=upper)
    return out.round(decimals)


def load_products_config(config_path: Path | None = None) -> list[dict[str, Any]]:
    path = config_path or CONFIG_PATH
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    products = payload.get("products", [])
    if not products:
        raise ValueError("config/products.json must contain at least one product.")
    required = {
        "productId", "name", "variety", "originDepartment", "originProvince", "originDistrict",
        "destinationMarket", "destinationCity", "latitude", "longitude", "climateZone",
        "basePricePerKg", "minimumPricePerKg", "maximumPricePerKg", "baseDailyVolumeKg",
        "minimumDailyVolumeKg", "maximumDailyVolumeKg", "harvestPeakMonths", "priceSeasonalityAmplitude",
        "volumeSeasonalityAmplitude", "priceTrendPerYear", "weatherSensitivity", "supplyPriceElasticity",
        "baseYieldTonsPerHa", "basePlantedAreaHa", "distanceToLimaKm", "baseLogisticsCostPerKg",
    }
    seen = set()
    normalized = []
    for product in products:
        missing = sorted(required.difference(product))
        if missing:
            raise ValueError(f"Product config missing required fields: {missing}")
        product_id = int(product["productId"])
        if product_id in seen:
            raise ValueError(f"Duplicate productId found in config: {product_id}")
        seen.add(product_id)
        zone = str(product["climateZone"])
        if zone not in CLIMATE_PROFILES:
            raise ValueError(f"Unknown climateZone '{zone}' for productId={product_id}")
        normalized.append({
            **product,
            "productId": product_id,
            "latitude": float(product["latitude"]),
            "longitude": float(product["longitude"]),
            "basePricePerKg": float(product["basePricePerKg"]),
            "minimumPricePerKg": float(product["minimumPricePerKg"]),
            "maximumPricePerKg": float(product["maximumPricePerKg"]),
            "baseDailyVolumeKg": float(product["baseDailyVolumeKg"]),
            "minimumDailyVolumeKg": float(product["minimumDailyVolumeKg"]),
            "maximumDailyVolumeKg": float(product["maximumDailyVolumeKg"]),
            "harvestPeakMonths": [int(month) for month in product["harvestPeakMonths"]],
            "priceSeasonalityAmplitude": float(product["priceSeasonalityAmplitude"]),
            "volumeSeasonalityAmplitude": float(product["volumeSeasonalityAmplitude"]),
            "priceTrendPerYear": float(product["priceTrendPerYear"]),
            "weatherSensitivity": float(product["weatherSensitivity"]),
            "supplyPriceElasticity": float(product["supplyPriceElasticity"]),
            "baseYieldTonsPerHa": float(product["baseYieldTonsPerHa"]),
            "basePlantedAreaHa": float(product["basePlantedAreaHa"]),
            "distanceToLimaKm": float(product["distanceToLimaKm"]),
            "baseLogisticsCostPerKg": float(product["baseLogisticsCostPerKg"]),
            "climateZone": zone,
        })
    return normalized


def _unique_locations(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = {}
    for product in products:
        key = (product["originDepartment"], product["originProvince"])
        if key not in seen:
            seen[key] = product
    return list(seen.values())


def generate_products(products_config: list[dict[str, Any]]) -> pd.DataFrame:
    return pd.DataFrame([
        {
            "product_id": product["productId"],
            "product_name": product["name"],
            "variety": product["variety"],
            "standard_unit": STANDARD_UNIT,
            "currency": CURRENCY,
            "is_synthetic": True,
        }
        for product in products_config
    ])


def _generate_weather_for_location(config: GenerationConfig, location: dict[str, Any], generated_at: str, salt: int) -> tuple[pd.DataFrame, pd.DataFrame]:
    dates = _date_range(config.start_date, config.end_date)
    rng = _rng(config.seed, salt)
    profile = CLIMATE_PROFILES[location["climateZone"]]
    df = pd.DataFrame({"date": dates})
    angle = 2 * np.pi * (df["date"].dt.dayofyear.to_numpy() / 365.25)
    heat_wave = np.zeros(len(df))
    humidity_surge = np.zeros(len(df))
    precipitation_spike = np.zeros(len(df))
    cold_snap = np.zeros(len(df))
    for year in sorted(df["date"].dt.year.unique()):
        positions = np.flatnonzero((df["date"].dt.year == year).to_numpy())
        if len(positions) < 20:
            continue
        def apply_events(target: np.ndarray, count: int, min_days: int, max_days: int, magnitude: tuple[float, float]) -> None:
            valid = positions[: max(1, len(positions) - max_days)]
            starts = rng.choice(valid, size=min(count, len(valid)), replace=False)
            for start in starts:
                duration = int(rng.integers(min_days, max_days + 1))
                target[start : start + duration] += float(rng.uniform(*magnitude))
        apply_events(heat_wave, 3, 3, 5, (1.5, 3.0))
        apply_events(humidity_surge, 4, 1, 3, (4.0, 9.0))
        apply_events(precipitation_spike, 3, 1, 2, (1.5, 5.0))
        apply_events(cold_snap, 2, 2, 4, (1.0, 2.6))
    temp_avg = profile["base_avg"] + profile["amp"] * np.sin(angle - 0.6) + 0.45 * heat_wave - 0.55 * cold_snap + rng.normal(0, 0.55, len(df))
    temp_min = temp_avg - (profile["low"] + 0.6 * np.sin(angle + 0.5) + rng.normal(0, 0.25, len(df))) - 0.12 * cold_snap
    temp_max = temp_avg + (profile["high"] + 0.6 * np.cos(angle - 0.3) + rng.normal(0, 0.25, len(df))) + 0.22 * heat_wave
    drizzle = np.where(rng.random(len(df)) < profile["rain_p"], rng.gamma(1.6, profile["rain_s"], len(df)), 0.0)
    precipitation = np.clip(drizzle + precipitation_spike, 0, None)
    humidity = profile["hum"] + profile["hum_amp"] * np.cos(angle - 0.15) + 0.9 * precipitation + 0.7 * humidity_surge + rng.normal(0, 3.0, len(df))
    wind = profile["wind"] + 1.8 * np.sin(angle + 0.3) + 0.18 * precipitation_spike + rng.normal(0, 1.8, len(df))
    df["department"] = location["originDepartment"]
    df["province"] = location["originProvince"]
    df["district"] = location["originDistrict"]
    df["latitude"] = location["latitude"]
    df["longitude"] = location["longitude"]
    df["temp_min_c"] = _clip_round(pd.Series(temp_min), -3, 25)
    df["temp_max_c"] = _clip_round(pd.Series(temp_max), 8, 38)
    df["temp_avg_c"] = _clip_round(pd.Series((df["temp_min_c"] + df["temp_max_c"]) / 2 + rng.normal(0, 0.25, len(df))), -1, 32)
    df["precipitation_mm"] = pd.Series(precipitation).round(2)
    df["humidity_avg"] = _clip_round(pd.Series(humidity), 35, 95)
    df["wind_speed_kmh"] = _clip_round(pd.Series(wind), 3, 35)
    df["source"] = SOURCE_NAME
    df["is_synthetic"] = True
    df["generated_at"] = generated_at
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    df["temp_avg_c"] = df[["temp_avg_c", "temp_min_c"]].max(axis=1)
    df["temp_avg_c"] = df[["temp_avg_c", "temp_max_c"]].min(axis=1).round(2)
    event_score = 0.36 * heat_wave + 0.18 * humidity_surge + 0.62 * precipitation_spike + 0.30 * cold_snap + 0.10 * precipitation
    feature_df = pd.DataFrame({
        "date": pd.to_datetime(df["date"]),
        "department": location["originDepartment"],
        "province": location["originProvince"],
        "event_score": np.round(event_score, 4),
    })
    return df, feature_df


def generate_weather(config: GenerationConfig, products_config: list[dict[str, Any]], generated_at: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    weather_frames = []
    feature_frames = []
    for idx, location in enumerate(_unique_locations(products_config), start=1):
        weather_df, feature_df = _generate_weather_for_location(config, location, generated_at, 100 * idx)
        weather_frames.append(weather_df)
        feature_frames.append(feature_df)
    return pd.concat(weather_frames, ignore_index=True), pd.concat(feature_frames, ignore_index=True)

def generate_crop_production(config: GenerationConfig, products_config: list[dict[str, Any]], weather_features: pd.DataFrame, generated_at: str) -> pd.DataFrame:
    months = _month_range(config.start_date, config.end_date)
    rows = []
    for idx, product in enumerate(products_config, start=1):
        rng = _rng(config.seed, 1000 + idx)
        df = pd.DataFrame({"month_start": months})
        month_number = df["month_start"].dt.month.to_numpy()
        month_idx = np.arange(len(df))
        peak_months = set(product["harvestPeakMonths"])
        peak_signal = np.array([1.0 if month in peak_months else -0.25 for month in month_number])
        annual_angle = 2 * np.pi * (month_number / 12.0)
        location_events = weather_features[
            (weather_features["department"] == product["originDepartment"])
            & (weather_features["province"] == product["originProvince"])
        ].set_index("date")["event_score"]
        event_pressure = []
        for month_start in months:
            recent = location_events.loc[month_start - pd.Timedelta(days=45) : month_start - pd.Timedelta(days=1)]
            event_pressure.append(float(recent.mean()) if not recent.empty else 0.0)
        event_pressure = np.array(event_pressure)
        planted_area = product["basePlantedAreaHa"] * (1.0 + 0.08 * np.sin(annual_angle - 0.7) + 0.10 * peak_signal)
        planted_area += (month_idx / 12.0) * max(4.0, product["basePlantedAreaHa"] * 0.005)
        planted_area += rng.normal(0, max(8.0, product["basePlantedAreaHa"] * 0.03), len(df))
        planted_area = np.clip(planted_area, product["basePlantedAreaHa"] * 0.72, product["basePlantedAreaHa"] * 1.28)
        harvested_ratio = 0.84 + 0.07 * np.where(peak_signal > 0, 1.0, 0.0) - 0.03 * event_pressure + rng.normal(0, 0.015, len(df))
        harvested_ratio = np.clip(harvested_ratio, 0.70, 0.98)
        yield_per_ha = product["baseYieldTonsPerHa"] * (1.0 + 0.12 * peak_signal + 0.05 * np.cos(annual_angle - 0.4))
        yield_per_ha += -0.22 * product["weatherSensitivity"] * event_pressure
        yield_per_ha += rng.normal(0, max(0.15, product["baseYieldTonsPerHa"] * 0.04), len(df))
        yield_per_ha = np.clip(yield_per_ha, max(0.4, product["baseYieldTonsPerHa"] * 0.65), product["baseYieldTonsPerHa"] * 1.35)
        df["year"] = df["month_start"].dt.year
        df["month"] = df["month_start"].dt.month
        df["product"] = product["name"]
        df["variety"] = product["variety"]
        df["department"] = product["originDepartment"]
        df["province"] = product["originProvince"]
        df["planted_area_ha"] = pd.Series(planted_area).round(2)
        df["harvested_area_ha"] = np.minimum(df["planted_area_ha"] * harvested_ratio, df["planted_area_ha"]).round(2)
        df["yield_tons_per_ha"] = pd.Series(yield_per_ha).round(2)
        df["production_tons"] = (df["harvested_area_ha"] * df["yield_tons_per_ha"]).round(2)
        df["source"] = SOURCE_NAME
        df["is_synthetic"] = True
        df["generated_at"] = generated_at
        rows.append(df[["year", "month", "product", "variety", "department", "province", "planted_area_ha", "harvested_area_ha", "production_tons", "yield_tons_per_ha", "source", "is_synthetic", "generated_at"]])
    return pd.concat(rows, ignore_index=True)


def generate_logistics_costs(config: GenerationConfig, products_config: list[dict[str, Any]], generated_at: str) -> pd.DataFrame:
    months = _month_range(config.start_date, config.end_date)
    rows = []
    for idx, product in enumerate(products_config, start=1):
        rng = _rng(config.seed, 2000 + idx)
        df = pd.DataFrame({"month_start": months})
        angle = 2 * np.pi * (df["month_start"].dt.month.to_numpy() / 12.0)
        month_idx = np.arange(len(df))
        fuel = 1.0 + 0.014 * month_idx + 0.05 * np.sin(angle - 0.5) + rng.normal(0, 0.015, len(df))
        fuel = np.clip(fuel, 0.95, None)
        cost = product["baseLogisticsCostPerKg"] * (1.0 + 0.010 * month_idx + 0.55 * (fuel - 1.0))
        cost += rng.normal(0, max(0.008, product["baseLogisticsCostPerKg"] * 0.03), len(df))
        lower = max(0.18, product["baseLogisticsCostPerKg"] * 0.80)
        upper = product["baseLogisticsCostPerKg"] * 1.45
        cost = np.round(np.clip(cost, lower, upper), 2)
        valid_from = df["month_start"]
        valid_to = (valid_from + pd.offsets.MonthEnd(1)).dt.normalize()
        rows.append(pd.DataFrame({
            "origin_department": product["originDepartment"],
            "origin_province": product["originProvince"],
            "destination_city": product["destinationCity"],
            "distance_km": int(round(product["distanceToLimaKm"])),
            "vehicle_type": "Truck",
            "max_capacity_kg": 10000,
            "total_transport_cost": np.round(10000 * cost, 2),
            "cost_per_kg": cost,
            "valid_from": valid_from.dt.strftime("%Y-%m-%d"),
            "valid_to": valid_to.dt.strftime("%Y-%m-%d"),
            "fuel_price_index": np.round(fuel, 3),
            "source": SOURCE_NAME,
            "is_synthetic": True,
            "generated_at": generated_at,
        }))
    return pd.concat(rows, ignore_index=True)


def generate_market_prices(config: GenerationConfig, products_config: list[dict[str, Any]], weather_features: pd.DataFrame, crop_df: pd.DataFrame, generated_at: str) -> pd.DataFrame:
    dates = _date_range(config.start_date, config.end_date)
    crop_monthly = crop_df.copy()
    crop_monthly["month_period"] = pd.to_datetime(crop_monthly["year"].astype(str) + "-" + crop_monthly["month"].astype(str).str.zfill(2) + "-01").dt.to_period("M")
    rows = []
    for idx, product in enumerate(products_config, start=1):
        rng = _rng(config.seed, 3000 + idx)
        df = pd.DataFrame({"date": dates})
        annual = np.sin(2 * np.pi * (df["date"].dt.dayofyear.to_numpy() / 365.25) - 1.0)
        weekly = np.sin(2 * np.pi * (df["date"].dt.dayofweek.to_numpy() / 7.0) + 0.45)
        elapsed_days = (df["date"] - df["date"].min()).dt.days.to_numpy()
        df["month_period"] = df["date"].dt.to_period("M")
        df["days_in_month"] = df["date"].dt.days_in_month
        peak_signal = np.array([1.0 if month in set(product["harvestPeakMonths"]) else -0.15 for month in df["date"].dt.month.to_numpy()])
        product_crop = crop_monthly[
            (crop_monthly["product"] == product["name"])
            & (crop_monthly["variety"] == product["variety"])
            & (crop_monthly["department"] == product["originDepartment"])
            & (crop_monthly["province"] == product["originProvince"])
        ]
        production_map = product_crop.set_index("month_period")["production_tons"]
        df["production_tons_month"] = df["month_period"].map(production_map).astype(float)
        mean_production = max(float(product_crop["production_tons"].mean()), 1.0)
        production_ratio = df["production_tons_month"].to_numpy() / mean_production
        monthly_market_kg = product["baseDailyVolumeKg"] * df["days_in_month"].to_numpy()
        monthly_market_kg *= 0.70 + 0.28 * production_ratio + 0.18 * peak_signal
        monthly_market_kg = np.clip(monthly_market_kg, product["minimumDailyVolumeKg"] * df["days_in_month"].to_numpy() * 0.85, None)
        intra = 1.0 + 0.10 * np.sin(2 * np.pi * (df["date"].dt.day.to_numpy() / df["days_in_month"].to_numpy()) - 0.7)
        vol_weekly = 1.0 + 0.03 * np.cos(2 * np.pi * (df["date"].dt.dayofweek.to_numpy() / 7.0) - 0.15)
        volume = (monthly_market_kg / df["days_in_month"].to_numpy()) * intra * vol_weekly * rng.normal(1.0, 0.05, len(df))
        volume = np.clip(volume, product["minimumDailyVolumeKg"], product["maximumDailyVolumeKg"])
        location_weather = weather_features[
            (weather_features["department"] == product["originDepartment"])
            & (weather_features["province"] == product["originProvince"])
        ].set_index("date")["event_score"]
        lagged_weather = location_weather.reindex(dates, fill_value=0.0).shift(7, fill_value=0.0).rolling(7, min_periods=1).mean().to_numpy()
        volume_z = (volume - volume.mean()) / max(volume.std(), 1e-6)
        avg_price = product["basePricePerKg"] + product["priceTrendPerYear"] * (elapsed_days / 365.25) + product["priceSeasonalityAmplitude"] * annual + 0.08 * weekly
        avg_price += -product["supplyPriceElasticity"] * volume_z + product["weatherSensitivity"] * lagged_weather + rng.normal(0, 0.12 + product["priceSeasonalityAmplitude"] * 0.03, len(df))
        avg_price = np.clip(avg_price, product["minimumPricePerKg"], product["maximumPricePerKg"])
        margin_lower = np.maximum(0.08, avg_price * rng.uniform(0.04, 0.09, len(df)))
        margin_upper = np.maximum(0.10, avg_price * rng.uniform(0.05, 0.10, len(df)))
        min_price = np.clip(avg_price - margin_lower, 0.1, None)
        max_price = np.clip(avg_price + margin_upper, None, product["maximumPricePerKg"] + 0.6)
        product_df = pd.DataFrame({
            "date": df["date"].dt.strftime("%Y-%m-%d"),
            "product": product["name"],
            "variety": product["variety"],
            "origin_department": product["originDepartment"],
            "origin_province": product["originProvince"],
            "market": product["destinationMarket"],
            "market_city": product["destinationCity"],
            "min_price_per_kg": np.round(min_price, 2),
            "avg_price_per_kg": np.round(avg_price, 2),
            "max_price_per_kg": np.round(max_price, 2),
            "volume_kg": np.round(volume, 2),
            "source": SOURCE_NAME,
            "is_synthetic": True,
            "generated_at": generated_at,
        })
        product_df["avg_price_per_kg"] = product_df[["avg_price_per_kg", "min_price_per_kg"]].max(axis=1)
        product_df["max_price_per_kg"] = product_df[["max_price_per_kg", "avg_price_per_kg"]].max(axis=1)
        rows.append(product_df)
    return pd.concat(rows, ignore_index=True)


def validate_clean_data(clean_data: dict[str, pd.DataFrame]) -> None:
    prices = clean_data["market_prices"]
    weather = clean_data["weather_daily"]
    crop = clean_data["crop_production_monthly"]
    logistics = clean_data["logistics_costs"]
    if not (prices["min_price_per_kg"] <= prices["avg_price_per_kg"]).all():
        raise ValueError("Validation failed: min_price_per_kg must be <= avg_price_per_kg.")
    if not (prices["avg_price_per_kg"] <= prices["max_price_per_kg"]).all():
        raise ValueError("Validation failed: avg_price_per_kg must be <= max_price_per_kg.")
    if not (weather["temp_min_c"] <= weather["temp_avg_c"]).all():
        raise ValueError("Validation failed: temp_min_c must be <= temp_avg_c.")
    if not (weather["temp_avg_c"] <= weather["temp_max_c"]).all():
        raise ValueError("Validation failed: temp_avg_c must be <= temp_max_c.")
    if not (crop["harvested_area_ha"] <= crop["planted_area_ha"]).all():
        raise ValueError("Validation failed: harvested_area_ha must be <= planted_area_ha.")
    if not (crop["production_tons"] >= 0).all():
        raise ValueError("Validation failed: production_tons must be >= 0.")
    if not (prices["volume_kg"] >= 0).all():
        raise ValueError("Validation failed: volume_kg must be >= 0.")
    if not (logistics["cost_per_kg"] >= 0).all():
        raise ValueError("Validation failed: cost_per_kg must be >= 0.")

def _inject_nulls(df: pd.DataFrame, rng: np.random.Generator, columns: list[str], rate: float) -> int:
    if df.empty or not columns:
        return 0
    target = max(1, int(round(len(df) * rate)))
    rows = rng.choice(df.index.to_numpy(), size=min(target, len(df)), replace=False)
    count = 0
    for row in rows:
        df.at[row, columns[count % len(columns)]] = np.nan
        count += 1
    return count


def _inject_duplicates(df: pd.DataFrame, rng: np.random.Generator, rate: float) -> tuple[pd.DataFrame, int]:
    if df.empty:
        return df, 0
    target = max(1, int(round(len(df) * rate)))
    sampled = df.sample(n=min(target, len(df)), random_state=int(rng.integers(0, 1_000_000)))
    return pd.concat([df, sampled], ignore_index=True), len(sampled)


def inject_raw_errors(clean_data: dict[str, pd.DataFrame], seed: int) -> tuple[dict[str, pd.DataFrame], dict[str, dict[str, Any]]]:
    raw_data = {name: df.copy(deep=True) for name, df in clean_data.items()}
    summary: dict[str, dict[str, Any]] = {}
    rates = {"null_rate": 0.015, "duplicate_rate": 0.007, "price_outlier_rate": 0.005, "name_variation_rate": 0.01}
    for offset, (name, df) in enumerate(raw_data.items(), start=1):
        rng = _rng(seed, 4000 + offset * 100)
        file_summary: dict[str, Any] = {"rows_before": len(df)}
        if name == "products":
            file_summary["nulls"] = _inject_nulls(df, rng, ["currency"], rates["null_rate"])
            if not df.empty:
                df.at[df.index[0], "standard_unit"] = "kilogramo"
            file_summary["unit_inconsistencies"] = 1
        elif name == "market_prices":
            file_summary["nulls"] = _inject_nulls(df, rng, ["avg_price_per_kg", "volume_kg", "market", "market_city"], rates["null_rate"])
            variation_count = max(1, int(round(len(df) * rates["name_variation_rate"])))
            variation_rows = rng.choice(df.index.to_numpy(), size=variation_count, replace=False)
            product_variants = ["GRANADA", "granada", "Granada Wonderful", "PAPA", "palta hass"]
            market_variants = ["M. Mayorista de Frutas", "MERCADO MAYORISTA DE FRUTAS", "GMM Lima"]
            for index, row in enumerate(variation_rows):
                if index % 2 == 0:
                    df.at[row, "product"] = product_variants[index % len(product_variants)]
                else:
                    df.at[row, "market"] = market_variants[index % len(market_variants)]
            file_summary["name_variations"] = variation_count
            outlier_count = max(1, int(round(len(df) * rates["price_outlier_rate"])))
            outlier_rows = rng.choice(df.index.to_numpy(), size=outlier_count, replace=False)
            multipliers = rng.choice([0.35, 1.9], size=outlier_count)
            for row, multiplier in zip(outlier_rows, multipliers):
                for column in ["min_price_per_kg", "avg_price_per_kg", "max_price_per_kg"]:
                    df.at[row, column] = round(float(df.at[row, column]) * float(multiplier), 2)
            file_summary["price_outliers"] = outlier_count
            invalid_rows = rng.choice(df.index.to_numpy(), size=min(2, len(df)), replace=False)
            for row, value in zip(invalid_rows, ["2026-02-30", "not_a_date"]):
                df.at[row, "date"] = value
            file_summary["invalid_dates"] = len(invalid_rows)
            df, duplicate_count = _inject_duplicates(df, rng, rates["duplicate_rate"])
            file_summary["duplicates"] = duplicate_count
        elif name == "weather_daily":
            file_summary["nulls"] = _inject_nulls(df, rng, ["humidity_avg", "wind_speed_kmh", "precipitation_mm"], rates["null_rate"])
            invalid_row = int(rng.choice(df.index.to_numpy(), size=1, replace=False)[0])
            df.at[invalid_row, "date"] = "2024-13-40"
            file_summary["invalid_dates"] = 1
            df, duplicate_count = _inject_duplicates(df, rng, rates["duplicate_rate"])
            file_summary["duplicates"] = duplicate_count
        elif name == "crop_production_monthly":
            file_summary["nulls"] = _inject_nulls(df, rng, ["yield_tons_per_ha", "production_tons"], rates["null_rate"])
            df, duplicate_count = _inject_duplicates(df, rng, rates["duplicate_rate"])
            file_summary["duplicates"] = duplicate_count
        elif name == "logistics_costs":
            file_summary["nulls"] = _inject_nulls(df, rng, ["cost_per_kg", "fuel_price_index"], rates["null_rate"])
            df, duplicate_count = _inject_duplicates(df, rng, rates["duplicate_rate"])
            file_summary["duplicates"] = duplicate_count
            file_summary["unit_inconsistencies"] = 0
        raw_data[name] = df
        file_summary["rows_after"] = len(df)
        summary[name] = file_summary
    return raw_data, summary


def _record_counts(data: dict[str, pd.DataFrame]) -> dict[str, int]:
    return {f"{name}.csv": int(len(df)) for name, df in data.items()}


def _ensure_can_write(paths: list[Path], overwrite: bool) -> None:
    existing = [path for path in paths if path.exists()]
    if existing and not overwrite:
        raise FileExistsError("Output files already exist. Use --overwrite to replace them: " + ", ".join(str(path) for path in existing))


def _save_dataset_group(base_dir: Path, data: dict[str, pd.DataFrame]) -> None:
    base_dir.mkdir(parents=True, exist_ok=True)
    for name, df in data.items():
        df.to_csv(base_dir / f"{name}.csv", index=False)


def _metadata_payload(config: GenerationConfig, products_config: list[dict[str, Any]], generated_at: str, clean_data: dict[str, pd.DataFrame], raw_data: dict[str, pd.DataFrame], raw_error_summary: dict[str, dict[str, Any]]) -> dict[str, Any]:
    return {
        "datasetType": "synthetic",
        "officialData": False,
        "randomSeed": config.seed,
        "startDate": config.start_date,
        "endDate": config.end_date,
        "productCount": len(products_config),
        "products": [
            {
                "productId": product["productId"],
                "product": product["name"],
                "variety": product["variety"],
                "origin": {"department": product["originDepartment"], "province": product["originProvince"]},
                "destination": {"market": product["destinationMarket"], "city": product["destinationCity"]},
            }
            for product in products_config
        ],
        "currency": CURRENCY,
        "standardUnit": STANDARD_UNIT,
        "generatorVersion": GENERATOR_VERSION,
        "generatedAt": generated_at,
        "disclaimer": "Dataset sintetico creado unicamente para desarrollo, pruebas y demostracion. No representa precios agricolas reales.",
        "recordCounts": {"synthetic_clean": _record_counts(clean_data), "raw": _record_counts(raw_data)},
        "rawErrorRates": raw_error_summary,
        "parameters": {"seed": config.seed, "start_date": config.start_date, "end_date": config.end_date, "overwrite": config.overwrite, "config_path": str(CONFIG_PATH)},
    }


def _print_summary(clean_data: dict[str, pd.DataFrame], raw_data: dict[str, pd.DataFrame]) -> None:
    print("Synthetic dataset generation summary")
    print("----------------------------------")
    for name, df in clean_data.items():
        print(f"synthetic_clean/{name}.csv: {len(df)} rows")
        if name == "market_prices":
            print(f"  products={df['product'].nunique()}, avg_price_per_kg mean={df['avg_price_per_kg'].mean():.2f}, volume_kg mean={df['volume_kg'].mean():.2f}")
        elif name == "weather_daily":
            print(f"  locations={df[['department', 'province']].drop_duplicates().shape[0]}, temp_avg_c mean={df['temp_avg_c'].mean():.2f}, precipitation_mm mean={df['precipitation_mm'].mean():.2f}")
        elif name == "crop_production_monthly":
            print(f"  products={df['product'].nunique()}, production_tons mean={df['production_tons'].mean():.2f}")
        elif name == "logistics_costs":
            print(f"  routes={df[['origin_department', 'origin_province']].drop_duplicates().shape[0]}, cost_per_kg mean={df['cost_per_kg'].mean():.2f}")
    for name, df in raw_data.items():
        print(f"raw/{name}.csv: {len(df)} rows")


def generate_synthetic_data(start_date: str, end_date: str, seed: int = RANDOM_SEED, output_root: Path | str | None = None, overwrite: bool = False) -> dict[str, Any]:
    if pd.Timestamp(start_date) > pd.Timestamp(end_date):
        raise ValueError("start_date must be earlier than or equal to end_date.")
    config = GenerationConfig(start_date=start_date, end_date=end_date, seed=seed, overwrite=overwrite)
    root = Path(output_root) if output_root is not None else Path(__file__).resolve().parent.parent
    data_dir = root / "data"
    clean_dir = data_dir / "synthetic_clean"
    raw_dir = data_dir / "raw"
    processed_dir = data_dir / "processed"
    metadata_dir = data_dir / "metadata"
    metadata_path = metadata_dir / "synthetic_data_metadata.json"
    metadata_generated_at = _timestamp()
    generated_at = _stable_generated_at(end_date)
    products_config = load_products_config()
    clean_data = {
        "products": generate_products(products_config),
    }
    weather_df, weather_features = generate_weather(config, products_config, generated_at)
    clean_data["weather_daily"] = weather_df
    clean_data["crop_production_monthly"] = generate_crop_production(config, products_config, weather_features, generated_at)
    clean_data["logistics_costs"] = generate_logistics_costs(config, products_config, generated_at)
    clean_data["market_prices"] = generate_market_prices(config, products_config, weather_features, clean_data["crop_production_monthly"], generated_at)
    validate_clean_data(clean_data)
    raw_data, raw_error_summary = inject_raw_errors(clean_data, seed)
    target_paths = [clean_dir / f"{name}.csv" for name in clean_data] + [raw_dir / f"{name}.csv" for name in raw_data] + [metadata_path]
    _ensure_can_write(target_paths, overwrite)
    clean_dir.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)
    _save_dataset_group(clean_dir, clean_data)
    _save_dataset_group(raw_dir, raw_data)
    metadata = _metadata_payload(config, products_config, metadata_generated_at, clean_data, raw_data, raw_error_summary)
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    _print_summary(clean_data, raw_data)
    return {"generated_at": metadata_generated_at, "metadata": metadata, "clean_data": clean_data, "raw_data": raw_data, "paths": {"data_dir": data_dir, "clean_dir": clean_dir, "raw_dir": raw_dir, "processed_dir": processed_dir, "metadata_path": metadata_path}}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate synthetic datasets for agro-price-prediction.")
    parser.add_argument("--start-date", required=True, help="Start date in YYYY-MM-DD format.")
    parser.add_argument("--end-date", required=True, help="End date in YYYY-MM-DD format.")
    parser.add_argument("--seed", type=int, default=RANDOM_SEED, help=f"Random seed. Default: {RANDOM_SEED}.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing generated files if they already exist.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    generate_synthetic_data(start_date=args.start_date, end_date=args.end_date, seed=args.seed, overwrite=args.overwrite)


if __name__ == "__main__":
    main()
