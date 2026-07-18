import pandas as pd

from src.etl.cleaners import coerce_dates, drop_required_nulls, remove_duplicates


def test_remove_duplicates() -> None:
    df = pd.DataFrame([
        {"date": "2024-01-01", "product": "Granada", "variety": "Wonderful", "origin_department": "Ica", "origin_province": "Ica", "market": "Mercado Mayorista de Frutas"},
        {"date": "2024-01-01", "product": "Granada", "variety": "Wonderful", "origin_department": "Ica", "origin_province": "Ica", "market": "Mercado Mayorista de Frutas"},
    ])
    deduped, removed = remove_duplicates("market_prices", df)
    assert removed == 1
    assert len(deduped) == 1


def test_invalid_dates_are_rejected() -> None:
    df = pd.DataFrame({"date": ["2024-01-01", "not_a_date"], "generated_at": ["2024-01-01", "2024-01-01"]})
    rejections = []
    cleaned = coerce_dates("market_prices", df, 0.6, rejections)
    assert len(cleaned) == 1
    assert len(rejections) == 1


def test_drop_required_nulls() -> None:
    df = pd.DataFrame([
        {"date": "2024-01-01", "product": "Granada", "variety": "Wonderful", "origin_department": "Ica", "origin_province": "Ica", "market": "Mercado Mayorista de Frutas", "avg_price_per_kg": 4.2},
        {"date": None, "product": "Granada", "variety": "Wonderful", "origin_department": "Ica", "origin_province": "Ica", "market": "Mercado Mayorista de Frutas", "avg_price_per_kg": 4.2},
    ])
    rejections = []
    cleaned = drop_required_nulls(df, rejections)
    assert len(cleaned) == 1
    assert len(rejections) == 1
