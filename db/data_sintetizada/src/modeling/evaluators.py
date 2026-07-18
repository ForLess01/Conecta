from __future__ import annotations

import math

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, median_absolute_error, r2_score


def mean_absolute_percentage_error_safe(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    denominator = np.where(np.abs(y_true) < 1e-8, np.nan, np.abs(y_true))
    values = np.abs((y_true - y_pred) / denominator)
    return float(np.nanmean(values) * 100)


def directional_accuracy(y_true: np.ndarray, y_pred: np.ndarray, reference: np.ndarray, tolerance: float = 0.01) -> float:
    actual_delta = (y_true - reference) / np.where(np.abs(reference) < 1e-8, np.nan, np.abs(reference))
    predicted_delta = (y_pred - reference) / np.where(np.abs(reference) < 1e-8, np.nan, np.abs(reference))
    def direction(values: np.ndarray) -> np.ndarray:
        return np.where(values >= tolerance, 1, np.where(values <= -tolerance, -1, 0))
    actual_direction = direction(actual_delta)
    predicted_direction = direction(predicted_delta)
    valid = ~np.isnan(actual_delta) & ~np.isnan(predicted_delta)
    if not valid.any():
        return float("nan")
    return float((actual_direction[valid] == predicted_direction[valid]).mean())


def regression_metrics(y_true: pd.Series, y_pred: np.ndarray, reference: pd.Series, tolerance: float) -> dict[str, float]:
    y_true_np = y_true.to_numpy(dtype=float)
    y_pred_np = np.asarray(y_pred, dtype=float)
    return {
        "MAE": float(mean_absolute_error(y_true_np, y_pred_np)),
        "RMSE": float(math.sqrt(mean_squared_error(y_true_np, y_pred_np))),
        "MAPE": mean_absolute_percentage_error_safe(y_true_np, y_pred_np),
        "R2": float(r2_score(y_true_np, y_pred_np)),
        "MedianAbsoluteError": float(median_absolute_error(y_true_np, y_pred_np)),
        "DirectionalAccuracy": directional_accuracy(y_true_np, y_pred_np, reference.to_numpy(dtype=float), tolerance),
    }
