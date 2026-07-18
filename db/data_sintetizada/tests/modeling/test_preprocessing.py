import pandas as pd

from src.modeling.preprocessing import build_preprocessor


def test_preprocessing_handles_categorical_and_numeric() -> None:
    df = pd.DataFrame({'product': ['Granada', 'Papa'], 'feature': [1.0, None]})
    preprocessor = build_preprocessor(['product'], ['feature'], scale_numeric=True)
    transformed = preprocessor.fit_transform(df)
    assert transformed.shape[0] == 2
