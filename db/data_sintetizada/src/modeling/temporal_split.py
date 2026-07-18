from __future__ import annotations

from dataclasses import dataclass

import pandas as pd
from sklearn.model_selection import TimeSeriesSplit

from .config import ModelingConfig


@dataclass
class TemporalSplitResult:
    train: pd.DataFrame
    validation: pd.DataFrame
    test: pd.DataFrame
    warnings: list[str]



def temporal_split_by_group(df: pd.DataFrame, config: ModelingConfig) -> TemporalSplitResult:
    warnings: list[str] = []
    train_parts: list[pd.DataFrame] = []
    validation_parts: list[pd.DataFrame] = []
    test_parts: list[pd.DataFrame] = []
    for (product, variety), group in df.groupby(["product", "variety"], dropna=False):
        ordered = group.sort_values(config.dateColumn).copy()
        n_rows = len(ordered)
        train_end = max(1, int(n_rows * (1 - config.validationFraction - config.testFraction)))
        validation_end = max(train_end + 1, int(n_rows * (1 - config.testFraction)))
        validation_end = min(validation_end, n_rows - 1)
        if train_end < config.minimumTrainingRowsPerProduct:
            warnings.append(f"{product}|{variety} has only {train_end} training rows for individual modeling.")
        train_parts.append(ordered.iloc[:train_end].copy())
        validation_parts.append(ordered.iloc[train_end:validation_end].copy())
        test_parts.append(ordered.iloc[validation_end:].copy())
    train = pd.concat(train_parts, axis=0).sort_values(config.dateColumn)
    validation = pd.concat(validation_parts, axis=0).sort_values(config.dateColumn)
    test = pd.concat(test_parts, axis=0).sort_values(config.dateColumn)
    return TemporalSplitResult(train=train, validation=validation, test=test, warnings=warnings)



def build_time_series_cv(n_splits: int = 3) -> TimeSeriesSplit:
    return TimeSeriesSplit(n_splits=n_splits)
