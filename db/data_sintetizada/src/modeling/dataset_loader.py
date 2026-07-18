from __future__ import annotations

from pathlib import Path

import pandas as pd

from .config import ModelingConfig


EXCLUDED_BASE_COLUMNS = {
    "source_x",
    "source_y",
    "is_synthetic_x",
    "is_synthetic_y",
    "generated_at_x",
    "generated_at_y",
    "date",
    "valid_from",
    "valid_to",
}

CATEGORICAL_COLUMNS = [
    "product",
    "variety",
    "origin_department",
    "origin_province",
    "market",
    "market_city",
    "vehicle_type",
]


class LoadedDatasets:
    def __init__(self, training: pd.DataFrame, inference: pd.DataFrame) -> None:
        self.training = training
        self.inference = inference



def load_processed_datasets(processed_dir: Path, config: ModelingConfig) -> LoadedDatasets:
    training = pd.read_csv(processed_dir / "training_dataset.csv")
    inference = pd.read_csv(processed_dir / "inference_dataset.csv")
    for frame in [training, inference]:
        frame[config.dateColumn] = pd.to_datetime(frame[config.dateColumn], errors="raise")
        frame.sort_values(config.groupColumns + [config.dateColumn], inplace=True)
        frame.reset_index(drop=True, inplace=True)
    return LoadedDatasets(training=training, inference=inference)



def get_feature_columns(df: pd.DataFrame, config: ModelingConfig) -> list[str]:
    excluded = set(EXCLUDED_BASE_COLUMNS)
    excluded.add(config.targetColumn)
    excluded.add(config.secondaryTargetColumn)
    return [column for column in df.columns if column not in excluded]



def split_feature_types(df: pd.DataFrame, feature_columns: list[str]) -> tuple[list[str], list[str]]:
    categorical = [column for column in feature_columns if column in CATEGORICAL_COLUMNS]
    numeric = [column for column in feature_columns if column not in categorical and pd.api.types.is_numeric_dtype(df[column])]
    return categorical, numeric
