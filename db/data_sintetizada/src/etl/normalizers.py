from __future__ import annotations

import re
import unicodedata

import pandas as pd


def clean_text(value: object) -> object:
    if pd.isna(value):
        return value
    text = str(value).strip()
    text = re.sub(r"\s+", " ", text)
    return text


def title_case(value: object) -> object:
    cleaned = clean_text(value)
    if pd.isna(cleaned):
        return cleaned
    return str(cleaned).title()


def normalize_with_alias(value: object, alias_map: dict[str, str]) -> object:
    cleaned = clean_text(value)
    if pd.isna(cleaned):
        return cleaned
    normalized_key = unicodedata.normalize("NFKC", str(cleaned)).strip().lower()
    if normalized_key in alias_map:
        return alias_map[normalized_key]
    return str(cleaned).title()


def normalize_products(df: pd.DataFrame, aliases: dict[str, dict[str, str]]) -> pd.DataFrame:
    df = df.copy()
    for column in ["product_name", "product"]:
        if column in df.columns:
            df[column] = df[column].map(lambda value: normalize_with_alias(value, aliases.get("products", {})))
    if "variety" in df.columns:
        df["variety"] = df["variety"].map(lambda value: normalize_with_alias(value, aliases.get("varieties", {})))
    return df


def normalize_locations(df: pd.DataFrame, aliases: dict[str, dict[str, str]]) -> pd.DataFrame:
    df = df.copy()
    for column in ["origin_department", "department"]:
        if column in df.columns:
            df[column] = df[column].map(lambda value: normalize_with_alias(value, aliases.get("departments", {})))
    for column in ["origin_province", "province"]:
        if column in df.columns:
            df[column] = df[column].map(lambda value: normalize_with_alias(value, aliases.get("provinces", {})))
    if "district" in df.columns:
        df["district"] = df["district"].map(title_case)
    return df


def normalize_markets(df: pd.DataFrame, aliases: dict[str, dict[str, str]]) -> pd.DataFrame:
    df = df.copy()
    if "market" in df.columns:
        df["market"] = df["market"].map(lambda value: normalize_with_alias(value, aliases.get("markets", {})))
    if "market_city" in df.columns:
        df["market_city"] = df["market_city"].map(title_case)
    if "destination_city" in df.columns:
        df["destination_city"] = df["destination_city"].map(title_case)
    return df


def normalize_frame(table_name: str, df: pd.DataFrame, aliases: dict[str, dict[str, str]]) -> pd.DataFrame:
    normalized = df.copy()
    for column in normalized.columns:
        if normalized[column].dtype == object:
            normalized[column] = normalized[column].map(clean_text)
    normalized = normalize_products(normalized, aliases)
    normalized = normalize_locations(normalized, aliases)
    normalized = normalize_markets(normalized, aliases)
    if "standard_unit" in normalized.columns:
        normalized["standard_unit"] = normalized["standard_unit"].map(lambda value: normalize_with_alias(value, {"kilogramo": "kg", "kg": "kg"}))
    if "currency" in normalized.columns:
        normalized["currency"] = normalized["currency"].map(lambda value: "PEN" if not pd.isna(value) and str(value).strip() else value)
    return normalized
