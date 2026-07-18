from __future__ import annotations

from collections import defaultdict
from typing import Any

import pandas as pd

from .config import DATE_COLUMNS, DUPLICATE_KEYS, NUMERIC_COLUMNS, OPTIONAL_NUMERIC_IMPUTATION, REQUIRED_MARKET_FIELDS


def append_rejections(rejections: list[dict[str, Any]], table_name: str, stage: str, reason: str, rejected_df: pd.DataFrame) -> None:
    if rejected_df.empty:
        return
    for row in rejected_df.to_dict(orient="records"):
        rejections.append({"source_file": table_name, "stage": stage, "reason": reason, "row_data": row})


def enrich_products_from_reference(products_df: pd.DataFrame, product_reference: list[dict[str, Any]]) -> pd.DataFrame:
    df = products_df.copy()
    if {"origin_department", "origin_province"}.issubset(df.columns):
        return df
    reference = pd.DataFrame(product_reference)
    reference = reference.rename(columns={"productId": "product_id", "name": "product_name", "originDepartment": "origin_department", "originProvince": "origin_province"})
    merged = df.merge(reference[["product_id", "product_name", "origin_department", "origin_province"]], on=["product_id", "product_name"], how="left")
    return merged


def remove_duplicates(table_name: str, df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    if table_name not in DUPLICATE_KEYS:
        return df.copy(), 0
    deduped = df.drop_duplicates(subset=DUPLICATE_KEYS[table_name], keep="first").copy()
    return deduped, int(len(df) - len(deduped))


def coerce_dates(table_name: str, df: pd.DataFrame, max_invalid_ratio: float, rejections: list[dict[str, Any]]) -> pd.DataFrame:
    cleaned = df.copy()
    for column in DATE_COLUMNS.get(table_name, []):
        parsed = pd.to_datetime(cleaned[column], errors="coerce")
        invalid_mask = parsed.isna() & cleaned[column].notna()
        invalid_ratio = float(invalid_mask.mean()) if len(cleaned) else 0.0
        if invalid_ratio > max_invalid_ratio:
            raise ValueError(f"Too many invalid dates in {table_name}.{column}: {invalid_ratio:.2%}")
        append_rejections(rejections, table_name, "date_validation", f"invalid_{column}", cleaned[invalid_mask])
        cleaned = cleaned.loc[~invalid_mask].copy()
        parsed = pd.to_datetime(cleaned[column], errors="coerce")
        cleaned[column] = parsed.dt.strftime("%Y-%m-%d")
    return cleaned


def coerce_numeric(table_name: str, df: pd.DataFrame, rejections: list[dict[str, Any]]) -> pd.DataFrame:
    cleaned = df.copy()
    for column in NUMERIC_COLUMNS.get(table_name, []):
        converted = pd.to_numeric(cleaned[column], errors="coerce")
        invalid_mask = converted.isna() & cleaned[column].notna()
        if invalid_mask.any():
            append_rejections(rejections, table_name, "numeric_validation", f"invalid_{column}", cleaned[invalid_mask])
        cleaned[column] = converted
    return cleaned


def drop_required_nulls(df: pd.DataFrame, rejections: list[dict[str, Any]]) -> pd.DataFrame:
    cleaned = df.copy()
    mask = cleaned[REQUIRED_MARKET_FIELDS].isna().any(axis=1)
    append_rejections(rejections, "market_prices", "required_nulls", "missing_required_market_field", cleaned[mask])
    return cleaned.loc[~mask].copy()


def impute_optional_numerics(table_name: str, df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    cleaned = df.copy()
    total_imputed = 0
    for column in OPTIONAL_NUMERIC_IMPUTATION.get(table_name, []):
        before = int(cleaned[column].isna().sum()) if column in cleaned.columns else 0
        if before == 0:
            continue
        if table_name == "market_prices":
            cleaned = cleaned.sort_values(["product", "variety", "origin_department", "origin_province", "market", "date"]).copy()
            cleaned[column] = cleaned.groupby(["product", "variety", "origin_department", "origin_province", "market"], dropna=False)[column].transform(lambda series: series.interpolate(method="linear", limit_direction="forward"))
            cleaned[column] = cleaned.groupby(["product", "variety", "origin_department", "origin_province"], dropna=False)[column].transform(lambda series: series.fillna(series.median()))
        elif table_name == "weather_daily":
            cleaned = cleaned.sort_values(["department", "province", "date"]).copy()
            cleaned[column] = cleaned.groupby(["department", "province"], dropna=False)[column].transform(lambda series: series.interpolate(method="linear", limit_direction="both"))
            cleaned[column] = cleaned.groupby(["department", "province"], dropna=False)[column].transform(lambda series: series.fillna(series.median()))
        elif table_name == "crop_production_monthly":
            cleaned[column] = cleaned.groupby(["product", "variety", "department", "province"], dropna=False)[column].transform(lambda series: series.fillna(series.median()))
        elif table_name == "logistics_costs":
            cleaned[column] = cleaned.groupby(["origin_department", "origin_province", "destination_city"], dropna=False)[column].transform(lambda series: series.fillna(series.median()))
        total_imputed += before - int(cleaned[column].isna().sum())
    return cleaned, total_imputed


def apply_integrity_rules(table_name: str, df: pd.DataFrame, rejections: list[dict[str, Any]]) -> pd.DataFrame:
    cleaned = df.copy()
    if table_name == "market_prices":
        invalid = (cleaned["min_price_per_kg"] <= 0) | (cleaned["min_price_per_kg"] > cleaned["avg_price_per_kg"]) | (cleaned["avg_price_per_kg"] > cleaned["max_price_per_kg"]) | (cleaned["volume_kg"] < 0)
    elif table_name == "weather_daily":
        invalid = (cleaned["temp_min_c"] > cleaned["temp_avg_c"]) | (cleaned["temp_avg_c"] > cleaned["temp_max_c"]) | (cleaned["precipitation_mm"] < 0) | (cleaned["humidity_avg"] < 0) | (cleaned["humidity_avg"] > 100) | (cleaned["wind_speed_kmh"] < 0)
    elif table_name == "crop_production_monthly":
        invalid = (cleaned["planted_area_ha"] < 0) | (cleaned["harvested_area_ha"] < 0) | (cleaned["harvested_area_ha"] > cleaned["planted_area_ha"]) | (cleaned["production_tons"] < 0) | (cleaned["yield_tons_per_ha"] < 0)
    elif table_name == "logistics_costs":
        invalid = (cleaned["distance_km"] <= 0) | (cleaned["max_capacity_kg"] <= 0) | (cleaned["total_transport_cost"] < 0) | (cleaned["cost_per_kg"] < 0)
    else:
        return cleaned
    append_rejections(rejections, table_name, "integrity_rules", "failed_integrity_rules", cleaned[invalid])
    return cleaned.loc[~invalid].copy()


def detect_outliers(df: pd.DataFrame, value_column: str, group_columns: list[str]) -> tuple[pd.Series, pd.Series]:
    grouped = df.groupby(group_columns, dropna=False)[value_column]
    q1 = grouped.transform(lambda series: series.quantile(0.25))
    q3 = grouped.transform(lambda series: series.quantile(0.75))
    iqr = q3 - q1
    mild = (df[value_column] < (q1 - 1.5 * iqr)) | (df[value_column] > (q3 + 1.5 * iqr))
    extreme = (df[value_column] < (q1 - 3 * iqr)) | (df[value_column] > (q3 + 3 * iqr))
    return mild.fillna(False), extreme.fillna(False)


def summarize_nulls(df: pd.DataFrame) -> dict[str, int]:
    return {column: int(count) for column, count in df.isna().sum().to_dict().items() if int(count) > 0}
