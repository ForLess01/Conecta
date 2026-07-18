from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.etl.config import ETLPaths, ETLSettings
from src.etl.pipeline import run_pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the ETL pipeline for agro-price-prediction.")
    parser.add_argument("--input-dir", default="data/raw")
    parser.add_argument("--output-dir", default="data/processed")
    parser.add_argument("--overwrite", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    settings = ETLSettings(paths=ETLPaths(input_dir=Path(args.input_dir), output_dir=Path(args.output_dir), overwrite=args.overwrite))
    run_pipeline(settings)


if __name__ == "__main__":
    main()
