from __future__ import annotations

import json
from pathlib import Path

from pydantic import BaseModel, Field


class ModelingConfig(BaseModel):
    targetColumn: str
    secondaryTargetColumn: str
    dateColumn: str
    groupColumns: list[str]
    testFraction: float
    validationFraction: float
    randomSeed: int
    minimumTrainingRowsPerProduct: int
    modelStrategy: str
    selectionMetric: str
    predictionIntervalConfidence: float
    directionalTolerance: float = 0.01


class ModelingPaths(BaseModel):
    processed_dir: Path = Field(default=Path("data/processed"))
    models_dir: Path = Field(default=Path("models"))
    reports_dir: Path = Field(default=Path("reports"))
    config_path: Path = Field(default=Path("config/modeling.json"))


def load_modeling_config(path: Path | None = None) -> ModelingConfig:
    config_path = path or Path("config/modeling.json")
    payload = json.loads(config_path.read_text(encoding="utf-8-sig"))
    return ModelingConfig.model_validate(payload)
