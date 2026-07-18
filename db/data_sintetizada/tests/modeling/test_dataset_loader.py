from pathlib import Path

from src.modeling.config import load_modeling_config
from src.modeling.dataset_loader import get_feature_columns, load_processed_datasets


def test_dataset_loader_reads_processed_data() -> None:
    config = load_modeling_config()
    datasets = load_processed_datasets(Path('data/processed'), config)
    assert not datasets.training.empty
    assert not datasets.inference.empty
    features = get_feature_columns(datasets.training, config)
    assert config.targetColumn not in features
    assert config.secondaryTargetColumn not in features
