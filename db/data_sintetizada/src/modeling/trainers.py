from __future__ import annotations

import os
from dataclasses import dataclass

os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("LOKY_MAX_CPU_COUNT", "1")

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.model_selection import RandomizedSearchCV
from sklearn.pipeline import Pipeline
from xgboost import XGBRegressor

from .config import ModelingConfig
from .preprocessing import build_preprocessor
from .temporal_split import build_time_series_cv


@dataclass
class TrainedModelResult:
    model_name: str
    estimator: Pipeline
    validation_predictions: np.ndarray
    test_predictions: np.ndarray
    hyperparameters: dict
    failed: bool = False
    failure_reason: str | None = None


MODEL_SPECS = {
    "LinearRegression": {"estimator": LinearRegression(), "scale_numeric": True, "param_distributions": {}, "n_iter": 1},
    "Ridge": {"estimator": Ridge(random_state=42), "scale_numeric": True, "param_distributions": {"model__alpha": [0.01, 0.1, 1.0, 10.0, 100.0]}, "n_iter": 5},
    "RandomForestRegressor": {
        "estimator": RandomForestRegressor(random_state=42, n_jobs=1),
        "scale_numeric": False,
        "param_distributions": {"model__n_estimators": [150, 250], "model__max_depth": [8, 12, None], "model__min_samples_leaf": [1, 3, 5], "model__max_features": ["sqrt", 0.7]},
        "n_iter": 3,
    },
    "HistGradientBoostingRegressor": {
        "estimator": HistGradientBoostingRegressor(random_state=42),
        "scale_numeric": False,
        "param_distributions": {"model__learning_rate": [0.03, 0.05, 0.1], "model__max_iter": [150, 250], "model__max_leaf_nodes": [15, 31], "model__l2_regularization": [0.0, 0.1, 1.0]},
        "n_iter": 3,
    },
    "XGBoostRegressor": {
        "estimator": XGBRegressor(random_state=42, objective="reg:squarederror", n_jobs=1, verbosity=0),
        "scale_numeric": False,
        "param_distributions": {"model__n_estimators": [150, 250], "model__max_depth": [3, 5, 7], "model__learning_rate": [0.03, 0.05, 0.1], "model__subsample": [0.8, 1.0], "model__colsample_bytree": [0.8, 1.0], "model__reg_lambda": [1.0, 5.0]},
        "n_iter": 3,
    },
}


def _build_pipeline(model_name: str, categorical_columns: list[str], numeric_columns: list[str]) -> Pipeline:
    spec = MODEL_SPECS[model_name]
    return Pipeline([
        ("preprocessor", build_preprocessor(categorical_columns, numeric_columns, scale_numeric=spec["scale_numeric"])),
        ("model", clone(spec["estimator"])),
    ])



def fit_model_candidates(train_df: pd.DataFrame, validation_df: pd.DataFrame, test_df: pd.DataFrame, feature_columns: list[str], categorical_columns: list[str], numeric_columns: list[str], target_column: str, config: ModelingConfig) -> list[TrainedModelResult]:
    results: list[TrainedModelResult] = []
    x_train = train_df[feature_columns]
    y_train = train_df[target_column]
    x_validation = validation_df[feature_columns]
    x_test = test_df[feature_columns]
    train_val = pd.concat([train_df, validation_df], ignore_index=False)
    x_train_val = train_val[feature_columns]
    y_train_val = train_val[target_column]
    cv = build_time_series_cv(3)
    for model_name, spec in MODEL_SPECS.items():
        try:
            pipeline = _build_pipeline(model_name, categorical_columns, numeric_columns)
            if spec["param_distributions"]:
                search = RandomizedSearchCV(estimator=pipeline, param_distributions=spec["param_distributions"], n_iter=spec["n_iter"], cv=cv, scoring="neg_mean_absolute_error", random_state=config.randomSeed, n_jobs=1, error_score="raise")
                search.fit(x_train, y_train)
                best_pipeline = search.best_estimator_
                best_params = search.best_params_
            else:
                best_pipeline = pipeline.fit(x_train, y_train)
                best_params = {}
            validation_predictions = best_pipeline.predict(x_validation)
            final_pipeline = clone(best_pipeline)
            final_pipeline.fit(x_train_val, y_train_val)
            test_predictions = final_pipeline.predict(x_test)
            results.append(TrainedModelResult(model_name, final_pipeline, validation_predictions, test_predictions, best_params))
        except Exception as exc:
            results.append(TrainedModelResult(model_name, None, np.array([]), np.array([]), {}, True, str(exc)))  # type: ignore[arg-type]
    return results
