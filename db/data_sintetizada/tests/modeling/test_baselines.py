import pandas as pd

from src.modeling.baselines import run_baselines


def test_baselines_return_expected_columns() -> None:
    df = pd.DataFrame({'price_lag_1': [1.0], 'price_rolling_mean_7': [2.0], 'price_rolling_mean_30': [3.0]})
    baselines = run_baselines(df)
    assert baselines['last_price'][0] == 1.0
    assert baselines['rolling_mean_7'][0] == 2.0
    assert baselines['rolling_mean_30'][0] == 3.0
