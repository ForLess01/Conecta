from pathlib import Path

import pandas as pd
import pytest

from src.etl.validators import ETLValidationError, validate_input_files, validate_required_columns


def test_missing_input_files(tmp_path: Path) -> None:
    with pytest.raises(ETLValidationError):
        validate_input_files(tmp_path)


def test_missing_columns() -> None:
    df = pd.DataFrame({"product_id": [1]})
    with pytest.raises(ETLValidationError):
        validate_required_columns("products", df)
