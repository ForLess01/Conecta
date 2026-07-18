from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd


def slugify_product(product: str, variety: str) -> str:
    return f"{product}_{variety}".lower().replace(" ", "_").replace("|", "_")



def save_model_artifacts(base_dir: Path, estimator, metadata: dict, feature_columns: list[str], residual_margin_value: float) -> None:
    base_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(estimator, base_dir / "model.joblib")
    (base_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    (base_dir / "feature_columns.json").write_text(json.dumps(feature_columns, indent=2), encoding="utf-8")
    (base_dir / "residuals.json").write_text(json.dumps({"margin": residual_margin_value}, indent=2), encoding="utf-8")



def write_registry(models_dir: Path, registry_payload: dict) -> None:
    models_dir.mkdir(parents=True, exist_ok=True)
    (models_dir / "registry.json").write_text(json.dumps(registry_payload, indent=2), encoding="utf-8")



def save_dataframe(path: Path, df: pd.DataFrame) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix.lower() == ".json":
        path.write_text(df.to_json(orient="records", indent=2), encoding="utf-8")
    else:
        df.to_csv(path, index=False)
