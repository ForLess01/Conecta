import numpy as np
import pandas as pd

from src.modeling.evaluators import directional_accuracy, regression_metrics


def test_directional_accuracy() -> None:
    y_true = np.array([11.0, 9.0, 10.0])
    y_pred = np.array([10.8, 9.2, 10.0])
    reference = np.array([10.0, 10.0, 10.0])
    score = directional_accuracy(y_true, y_pred, reference, tolerance=0.01)
    assert score == 1.0


def test_regression_metrics() -> None:
    metrics = regression_metrics(pd.Series([1.0, 2.0]), np.array([1.0, 2.5]), pd.Series([1.0, 2.0]), 0.01)
    assert 'MAE' in metrics and 'RMSE' in metrics and 'DirectionalAccuracy' in metrics
