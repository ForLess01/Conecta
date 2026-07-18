from __future__ import annotations

import numpy as np
import pandas as pd


BASELINE_COLUMNS = {
    "last_price": "price_lag_1",
    "rolling_mean_7": "price_rolling_mean_7",
    "rolling_mean_30": "price_rolling_mean_30",
}


def run_baselines(df: pd.DataFrame) -> dict[str, np.ndarray]:
    predictions: dict[str, np.ndarray] = {}
    for name, column in BASELINE_COLUMNS.items():
        predictions[name] = df[column].to_numpy(dtype=float)
    return predictions
