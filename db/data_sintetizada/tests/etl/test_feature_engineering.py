import pandas as pd

from src.etl.feature_engineering import create_features


def sample_frame() -> pd.DataFrame:
    dates = pd.date_range("2024-01-01", periods=40, freq="D")
    return pd.DataFrame({
        "date": dates.strftime("%Y-%m-%d"),
        "product": ["Granada"] * len(dates),
        "variety": ["Wonderful"] * len(dates),
        "origin_department": ["Ica"] * len(dates),
        "origin_province": ["Ica"] * len(dates),
        "market": ["Mercado Mayorista de Frutas"] * len(dates),
        "avg_price_per_kg": range(1, len(dates) + 1),
        "volume_kg": range(100, 100 + len(dates)),
        "temp_avg_c": [20.0] * len(dates),
        "precipitation_mm": [0.0] * len(dates),
        "humidity_avg": [60.0] * len(dates),
        "production_tons": [1000.0] * len(dates),
        "yield_tons_per_ha": [10.0] * len(dates),
        "cost_per_kg": [0.4] * len(dates),
        "fuel_price_index": [1.0] * len(dates),
    })


def test_lag_and_rolling_features() -> None:
    featured = create_features(sample_frame())
    row = featured.iloc[10]
    assert row["price_lag_1"] == 10
    assert round(row["price_rolling_mean_7"], 2) == 7.0


def test_targets_do_not_use_current_day() -> None:
    featured = create_features(sample_frame())
    row = featured.iloc[0]
    assert row["target_price_next_day"] == 2
    assert row["target_price_next_7_days"] == 5.0
