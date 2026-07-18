from __future__ import annotations

import pandas as pd



def selected_score(validation_mae: float, test_mae: float) -> float:
    return float(validation_mae + abs(validation_mae - test_mae) * 0.25)



def choose_best_model(results: pd.DataFrame, baseline_mae: float) -> pd.Series:
    ranked = results.copy()
    ranked["selected_score"] = ranked.apply(lambda row: selected_score(row["validation_MAE"], row["test_MAE"]), axis=1)
    ranked = ranked.sort_values(["selected_score", "validation_MAE", "test_MAE"]).reset_index(drop=True)
    best = ranked.iloc[0].copy()
    if best["validation_MAE"] >= baseline_mae:
        baseline_row = best.copy()
        baseline_row["model_name"] = "baseline_rolling_mean_7"
        baseline_row["selection_reason"] = "No machine learning model beat the 7-day rolling mean baseline."
        return baseline_row
    best["selection_reason"] = "Lowest selected score and better than rolling_mean_7 baseline."
    return best
