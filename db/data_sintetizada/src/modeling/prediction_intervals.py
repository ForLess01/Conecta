from __future__ import annotations

import numpy as np


def residual_margin(y_true: np.ndarray, y_pred: np.ndarray, confidence: float) -> float:
    absolute_errors = np.abs(np.asarray(y_true, dtype=float) - np.asarray(y_pred, dtype=float))
    percentile = max(0, min(100, confidence * 100))
    return float(np.percentile(absolute_errors, percentile))


def apply_interval(predictions: np.ndarray, margin: float) -> tuple[np.ndarray, np.ndarray]:
    lower = np.maximum(0.0, predictions - margin)
    upper = predictions + margin
    return lower, upper
