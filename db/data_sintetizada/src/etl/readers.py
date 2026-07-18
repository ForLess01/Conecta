from __future__ import annotations

from pathlib import Path

import pandas as pd

from .config import REQUIRED_FILES


def read_raw_tables(input_dir: Path) -> dict[str, pd.DataFrame]:
    tables: dict[str, pd.DataFrame] = {}
    for logical_name, file_name in REQUIRED_FILES.items():
        tables[logical_name] = pd.read_csv(input_dir / file_name)
    return tables
