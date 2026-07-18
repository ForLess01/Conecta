from __future__ import annotations

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler



def build_preprocessor(categorical_columns: list[str], numeric_columns: list[str], scale_numeric: bool) -> ColumnTransformer:
    categorical_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])
    numeric_steps = [("imputer", SimpleImputer(strategy="median"))]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))
    numeric_transformer = Pipeline(numeric_steps)
    return ColumnTransformer([
        ("categorical", categorical_transformer, categorical_columns),
        ("numeric", numeric_transformer, numeric_columns),
    ], remainder="drop")
