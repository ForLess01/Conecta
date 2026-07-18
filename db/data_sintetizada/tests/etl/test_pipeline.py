import json
from pathlib import Path

import pandas as pd

from src.etl.config import ETLPaths, ETLSettings
from src.etl.pipeline import run_pipeline


def test_pipeline_outputs_and_idempotence(tmp_path: Path) -> None:
    output_dir_a = tmp_path / "out_a"
    output_dir_b = tmp_path / "out_b"
    settings_a = ETLSettings(paths=ETLPaths(input_dir=Path("data/raw"), output_dir=output_dir_a, overwrite=True))
    settings_b = ETLSettings(paths=ETLPaths(input_dir=Path("data/raw"), output_dir=output_dir_b, overwrite=True))
    run_pipeline(settings_a)
    run_pipeline(settings_b)
    train_a = pd.read_csv(output_dir_a / "training_dataset.csv")
    train_b = pd.read_csv(output_dir_b / "training_dataset.csv")
    assert train_a.equals(train_b)
    assert (output_dir_a / "training_dataset.parquet").exists()
    report = json.loads((output_dir_a / "etl_quality_report.json").read_text(encoding="utf-8"))
    assert report["status"] == "SUCCESS"
    assert report["trainingRows"] == len(train_a)
