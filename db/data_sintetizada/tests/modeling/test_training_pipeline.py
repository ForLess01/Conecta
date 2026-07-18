from pathlib import Path

from src.modeling.config import ModelingPaths
from src.modeling.pipeline import predict_latest, train_and_evaluate


def test_training_pipeline_runs() -> None:
    result = train_and_evaluate(ModelingPaths())
    assert result['best_global']['model_name']
    prediction_df = predict_latest(ModelingPaths())
    assert len(prediction_df) == 5
    assert (Path('models/registry.json')).exists()
