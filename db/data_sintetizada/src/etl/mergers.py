from __future__ import annotations

import pandas as pd


def merge_with_weather(market_prices: pd.DataFrame, weather_daily: pd.DataFrame) -> pd.DataFrame:
    weather = weather_daily.rename(columns={"department": "origin_department", "province": "origin_province"})
    columns = ["date", "origin_department", "origin_province", "temp_min_c", "temp_max_c", "temp_avg_c", "precipitation_mm", "humidity_avg", "wind_speed_kmh"]
    return market_prices.merge(weather[columns], on=["date", "origin_department", "origin_province"], how="left", validate="many_to_one")


def merge_with_production(market_weather: pd.DataFrame, crop_production: pd.DataFrame) -> pd.DataFrame:
    left = market_weather.copy()
    left["year"] = pd.to_datetime(left["date"]).dt.year
    left["month"] = pd.to_datetime(left["date"]).dt.month
    production = crop_production.rename(columns={"department": "origin_department", "province": "origin_province"})
    return left.merge(
        production[["year", "month", "product", "variety", "origin_department", "origin_province", "planted_area_ha", "harvested_area_ha", "production_tons", "yield_tons_per_ha"]],
        on=["year", "month", "product", "variety", "origin_department", "origin_province"],
        how="left",
        validate="many_to_one",
    )


def merge_with_logistics(market_production: pd.DataFrame, logistics_costs: pd.DataFrame) -> pd.DataFrame:
    left = market_production.copy()
    left["month_key"] = pd.to_datetime(left["date"]).dt.to_period("M")
    logistics = logistics_costs.copy()
    logistics["month_key"] = pd.to_datetime(logistics["valid_from"]).dt.to_period("M")
    merged = left.merge(
        logistics,
        left_on=["origin_department", "origin_province", "market_city", "month_key"],
        right_on=["origin_department", "origin_province", "destination_city", "month_key"],
        how="left",
        validate="many_to_one",
    )
    in_range = (pd.to_datetime(merged["date"]) >= pd.to_datetime(merged["valid_from"])) & (pd.to_datetime(merged["date"]) <= pd.to_datetime(merged["valid_to"]))
    merged = merged.loc[in_range | merged["valid_from"].isna()].copy()
    merged = merged.drop(columns=["destination_city", "month_key"])
    return merged
