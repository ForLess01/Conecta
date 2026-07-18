from src.modeling.config import load_modeling_config
from src.modeling.dataset_loader import load_processed_datasets
from src.modeling.temporal_split import temporal_split_by_group


def test_temporal_split_has_no_overlap() -> None:
    config = load_modeling_config()
    datasets = load_processed_datasets(__import__('pathlib').Path('data/processed'), config)
    split = temporal_split_by_group(datasets.training, config)
    assert split.train['date'].max() <= split.validation['date'].max()
    assert split.validation['date'].max() <= split.test['date'].max()
    assert set(split.train.index).isdisjoint(set(split.validation.index))
