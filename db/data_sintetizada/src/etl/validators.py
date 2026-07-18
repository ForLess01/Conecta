from __future__ import annotations

from pathlib import Path

import pandas as pd

from .config import REQUIRED_COLUMNS, REQUIRED_FILES


class ETLValidationError(Exception):
    pass


def validate_input_files(input_dir: Path) -> dict[str, Path]:
    paths: dict[str, Path] = {}
    missing: list[str] = []
    for logical_name, file_name in REQUIRED_FILES.items():
        path = input_dir / file_name
        if not path.exists():
            missing.append(file_name)
        else:
            paths[logical_name] = path
    if missing:
        raise ETLValidationError("Missing required input files: " + ", ".join(missing))
    return paths


def validate_required_columns(table_name: str, df: pd.DataFrame) -> None:
    missing = [column for column in REQUIRED_COLUMNS[table_name] if column not in df.columns]
    if missing:
        raise ETLValidationError(f"Missing required columns in {table_name}: {missing}")


def validate_output_targets(output_dir: Path, overwrite: bool) -> None:
    targets = [
        output_dir / "training_dataset.csv",
        output_dir / "training_dataset.parquet",
        output_dir / "inference_dataset.csv",
        output_dir / "rejected_rows.csv",
        output_dir / "etl_quality_report.json",
    ]
    existing = [str(path) for path in targets if path.exists()]
    if existing and not overwrite:
        raise ETLValidationError("Output files already exist. Use --overwrite to replace them: " + ", ".join(existing))
