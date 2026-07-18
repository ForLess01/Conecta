from __future__ import annotations

import pandas as pd

from .config import ModelingConfig
from .dataset_loader import get_feature_columns, split_feature_types


NON_PREDICTIVE_COLUMNS = {"year", "month"}


def select_model_features(df: pd.DataFrame, config: ModelingConfig) -> dict[str, list[str]]:
    feature_columns = [column for column in get_feature_columns(df, config) if column not in NON_PREDICTIVE_COLUMNS]
    feature_columns = [column for column in feature_columns if not df[column].isna().all()]
    non_constant = [column for column in feature_columns if df[column].nunique(dropna=False) > 1]
    categorical, numeric = split_feature_types(df, non_constant)
    return {
        "all": non_constant,
        "categorical": categorical,
        "numeric": numeric,
        "dropped": sorted(set(feature_columns).difference(non_constant)),
    }
