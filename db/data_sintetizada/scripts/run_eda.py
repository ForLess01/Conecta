from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.modeling.config import ModelingPaths, load_modeling_config
from src.modeling.dataset_loader import load_processed_datasets
from src.modeling.exploratory_analysis import run_eda


def main() -> None:
    paths = ModelingPaths()
    config = load_modeling_config(paths.config_path)
    datasets = load_processed_datasets(paths.processed_dir, config)
    run_eda(datasets.training, config, paths.reports_dir / 'eda')


if __name__ == '__main__':
    main()
