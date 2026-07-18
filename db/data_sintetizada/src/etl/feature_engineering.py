from __future__ import annotations

import pandas as pd


def create_features(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    frame["date"] = pd.to_datetime(frame["date"])
    frame = frame.sort_values(["product", "variety", "origin_department", "origin_province", "market", "date"]).copy()
    frame["day_of_week"] = frame["date"].dt.dayofweek
    frame["day_of_month"] = frame["date"].dt.day
    frame["week_of_year"] = frame["date"].dt.isocalendar().week.astype(int)
    frame["month"] = frame["date"].dt.month
    frame["quarter"] = frame["date"].dt.quarter
    frame["year"] = frame["date"].dt.year
    frame["is_weekend"] = frame["day_of_week"].isin([5, 6]).astype(int)
    frame["days_since_start"] = (frame["date"] - frame["date"].min()).dt.days
    group_cols = ["product", "variety", "origin_department", "origin_province", "market"]
    grouped = frame.groupby(group_cols, dropna=False, group_keys=False)
    for lag in [1, 3, 7, 14, 30]:
        frame[f"price_lag_{lag}"] = grouped["avg_price_per_kg"].shift(lag)
    for window in [3, 7, 14, 30]:
        frame[f"price_rolling_mean_{window}"] = grouped["avg_price_per_kg"].transform(lambda series, w=window: series.shift(1).rolling(w, min_periods=w).mean())
    for window in [7, 14]:
        frame[f"price_rolling_std_{window}"] = grouped["avg_price_per_kg"].transform(lambda series, w=window: series.shift(1).rolling(w, min_periods=w).std())
    frame["price_change_1d"] = grouped["avg_price_per_kg"].pct_change(1)
    frame["price_change_7d"] = grouped["avg_price_per_kg"].pct_change(7)
    frame["volume_lag_1"] = grouped["volume_kg"].shift(1)
    frame["volume_lag_7"] = grouped["volume_kg"].shift(7)
    frame["volume_rolling_mean_7"] = grouped["volume_kg"].transform(lambda series: series.shift(1).rolling(7, min_periods=7).mean())
    frame["volume_rolling_mean_14"] = grouped["volume_kg"].transform(lambda series: series.shift(1).rolling(14, min_periods=14).mean())
    frame["volume_change_7d"] = grouped["volume_kg"].pct_change(7)
    frame["temperature_rolling_mean_7"] = grouped["temp_avg_c"].transform(lambda series: series.shift(1).rolling(7, min_periods=7).mean())
    frame["temperature_rolling_mean_14"] = grouped["temp_avg_c"].transform(lambda series: series.shift(1).rolling(14, min_periods=14).mean())
    frame["precipitation_rolling_sum_7"] = grouped["precipitation_mm"].transform(lambda series: series.shift(1).rolling(7, min_periods=7).sum())
    frame["precipitation_rolling_sum_14"] = grouped["precipitation_mm"].transform(lambda series: series.shift(1).rolling(14, min_periods=14).sum())
    frame["humidity_rolling_mean_7"] = grouped["humidity_avg"].transform(lambda series: series.shift(1).rolling(7, min_periods=7).mean())
    frame["target_price_next_day"] = grouped["avg_price_per_kg"].shift(-1)
    frame["target_price_next_7_days"] = grouped["avg_price_per_kg"].transform(lambda series: series.shift(-1).rolling(7, min_periods=7).mean().shift(-6))
    frame["date"] = frame["date"].dt.strftime("%Y-%m-%d")
    return frame


def split_training_and_inference(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    feature_columns = [
        "price_lag_1", "price_lag_3", "price_lag_7", "price_lag_14", "price_lag_30",
        "price_rolling_mean_3", "price_rolling_mean_7", "price_rolling_mean_14", "price_rolling_mean_30",
        "price_rolling_std_7", "price_rolling_std_14", "price_change_1d", "price_change_7d",
        "volume_lag_1", "volume_lag_7", "volume_rolling_mean_7", "volume_rolling_mean_14", "volume_change_7d",
        "temperature_rolling_mean_7", "temperature_rolling_mean_14", "precipitation_rolling_sum_7", "precipitation_rolling_sum_14", "humidity_rolling_mean_7",
        "production_tons", "yield_tons_per_ha", "cost_per_kg", "fuel_price_index",
    ]
    inference = df.copy()
    training = df.dropna(subset=feature_columns + ["target_price_next_day", "target_price_next_7_days"]).copy()
    return training, inference

