from __future__ import annotations

import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import pandas as pd

from .artifact_manager import save_model_artifacts, slugify_product, write_registry
from .baselines import run_baselines
from .config import ModelingPaths, load_modeling_config
from .dataset_loader import load_processed_datasets
from .evaluators import regression_metrics
from .exploratory_analysis import run_eda
from .feature_selector import select_model_features
from .model_selector import choose_best_model
from .prediction_intervals import apply_interval, residual_margin
from .trainers import fit_model_candidates
from .temporal_split import temporal_split_by_group

LIMITATIONS = [
    "Modelo entrenado con datos sinteticos.",
    "No usar para decisiones comerciales reales.",
    "Las metricas no representan rendimiento con datos oficiales.",
]


def _plot_series(path: Path, x, y_true, y_pred, title: str) -> None:
    plt.figure(figsize=(9, 4))
    plt.plot(x, y_true, label="actual")
    plt.plot(x, y_pred, label="predicted")
    plt.legend()
    plt.title(title)
    plt.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(path, dpi=150)
    plt.close()


def _plot_hist(path: Path, values, title: str) -> None:
    plt.figure(figsize=(8, 4))
    plt.hist(values, bins=30)
    plt.title(title)
    plt.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(path, dpi=150)
    plt.close()


def _plot_bar(path: Path, labels: list[str], values: list[float], title: str, ylabel: str) -> None:
    plt.figure(figsize=(10, 4))
    plt.bar(labels, values)
    plt.title(title)
    plt.ylabel(ylabel)
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(path, dpi=150)
    plt.close()


def _feature_importance_frame(estimator) -> pd.DataFrame:
    model = estimator.named_steps["model"]
    feature_names = estimator.named_steps["preprocessor"].get_feature_names_out().tolist()
    if hasattr(model, "feature_importances_"):
        scores = model.feature_importances_
    elif hasattr(model, "coef_"):
        coef = model.coef_
        scores = coef if coef.ndim == 1 else coef[0]
    else:
        scores = [0.0] * len(feature_names)
    return pd.DataFrame({"feature": feature_names, "importance": scores}).sort_values("importance", ascending=False).head(20)


def _baseline_metrics(split, config) -> pd.DataFrame:
    val_preds = run_baselines(split.validation)
    test_preds = run_baselines(split.test)
    rows = []
    for name, predictions in val_preds.items():
        validation = regression_metrics(split.validation[config.targetColumn], predictions, split.validation["price_rolling_mean_7"], config.directionalTolerance)
        test = regression_metrics(split.test[config.targetColumn], test_preds[name], split.test["price_rolling_mean_7"], config.directionalTolerance)
        rows.append({"model_name": name, **{f"validation_{k}": v for k, v in validation.items()}, **{f"test_{k}": v for k, v in test.items()}})
    return pd.DataFrame(rows)


def _candidate_metrics(candidates, split, config) -> pd.DataFrame:
    rows = []
    for candidate in candidates:
        validation = regression_metrics(split.validation[config.targetColumn], candidate.validation_predictions, split.validation["price_rolling_mean_7"], config.directionalTolerance)
        test = regression_metrics(split.test[config.targetColumn], candidate.test_predictions, split.test["price_rolling_mean_7"], config.directionalTolerance)
        rows.append({"model_name": candidate.model_name, "estimator": candidate.estimator, "hyperparameters": candidate.hyperparameters, **{f"validation_{k}": v for k, v in validation.items()}, **{f"test_{k}": v for k, v in test.items()}})
    return pd.DataFrame(rows)


def _model_lookup(model_df: pd.DataFrame, model_name: str, field: str):
    return model_df.loc[model_df["model_name"] == model_name, field].iloc[0]


def train_and_evaluate(paths: ModelingPaths | None = None) -> dict:
    paths = paths or ModelingPaths()
    config = load_modeling_config(paths.config_path)
    datasets = load_processed_datasets(paths.processed_dir, config)
    training_df = datasets.training.copy()
    run_eda(training_df, config, paths.reports_dir / "eda")
    split = temporal_split_by_group(training_df, config)
    feature_spec = select_model_features(training_df, config)
    baseline_df = _baseline_metrics(split, config)
    candidates = fit_model_candidates(split.train, split.validation, split.test, feature_spec["all"], feature_spec["categorical"], feature_spec["numeric"], config.targetColumn, config)
    successful_candidates = [candidate for candidate in candidates if not candidate.failed]
    if not successful_candidates:
        raise RuntimeError("No model candidates trained successfully.")
    model_df = _candidate_metrics(successful_candidates, split, config)
    baseline_mae = float(baseline_df.loc[baseline_df["model_name"] == "rolling_mean_7", "validation_MAE"].iloc[0])
    best_global = choose_best_model(model_df.drop(columns=["estimator", "hyperparameters"]), baseline_mae)
    best_global_name = best_global["model_name"]
    best_global_estimator = _model_lookup(model_df, best_global_name, "estimator")
    best_global_hyperparameters = _model_lookup(model_df, best_global_name, "hyperparameters")
    global_candidate = next(candidate for candidate in successful_candidates if candidate.model_name == best_global_name)
    global_margin = residual_margin(split.validation[config.targetColumn].to_numpy(), global_candidate.validation_predictions, config.predictionIntervalConfidence)
    reports_training = paths.reports_dir / "training"
    reports_training.mkdir(parents=True, exist_ok=True)
    save_model_artifacts(paths.models_dir / "global", best_global_estimator, {
        "modelName": best_global_name,
        "strategy": "global",
        "target": config.targetColumn,
        "trainingStartDate": str(split.train[config.dateColumn].min().date()),
        "trainingEndDate": str(split.train[config.dateColumn].max().date()),
        "validationStartDate": str(split.validation[config.dateColumn].min().date()),
        "validationEndDate": str(split.validation[config.dateColumn].max().date()),
        "testStartDate": str(split.test[config.dateColumn].min().date()),
        "testEndDate": str(split.test[config.dateColumn].max().date()),
        "features": feature_spec["all"],
        "metrics": best_global.to_dict(),
        "baselineMetrics": baseline_df.to_dict(orient="records"),
        "hyperparameters": best_global_hyperparameters,
        "randomSeed": config.randomSeed,
        "syntheticData": True,
        "limitations": LIMITATIONS,
    }, feature_spec["all"], global_margin)
    feature_importance_global = _feature_importance_frame(best_global_estimator)
    feature_importance_global.to_csv(reports_training / "feature_importance_global.csv", index=False)
    global_test_predictions = best_global_estimator.predict(split.test[feature_spec["all"]])
    _plot_series(reports_training / "actual_vs_predicted_global.png", split.test[config.dateColumn], split.test[config.targetColumn], global_test_predictions, "Actual vs Predicted - Global")
    _plot_hist(reports_training / "residual_distribution_global.png", split.test[config.targetColumn] - global_test_predictions, "Residual Distribution - Global")
    _plot_series(reports_training / "residuals_over_time_global.png", split.test[config.dateColumn], split.test[config.targetColumn] - global_test_predictions, [0.0] * len(split.test), "Residuals Over Time - Global")
    baseline_df.to_csv(reports_training / "baseline_comparison.csv", index=False)
    model_df.drop(columns=["estimator", "hyperparameters"]).to_csv(reports_training / "model_comparison.csv", index=False)
    _plot_bar(reports_training / "model_mae_comparison.png", model_df["model_name"].tolist(), model_df["validation_MAE"].tolist(), "Model MAE Comparison", "Validation MAE")
    _plot_bar(reports_training / "baseline_vs_models.png", baseline_df["model_name"].tolist() + model_df["model_name"].tolist(), baseline_df["validation_MAE"].tolist() + model_df["validation_MAE"].tolist(), "Baseline vs Models", "Validation MAE")
    metrics_by_product = {}
    selected_models = {}
    registry_products = {}
    for (product, variety), product_df in training_df.groupby(["product", "variety"], dropna=False):
        product_slug = slugify_product(product, variety)
        product_split = temporal_split_by_group(product_df, config)
        product_features = select_model_features(product_df, config)
        product_baseline_df = _baseline_metrics(product_split, config)
        product_candidates = fit_model_candidates(product_split.train, product_split.validation, product_split.test, product_features["all"], product_features["categorical"], product_features["numeric"], config.targetColumn, config)
        successful_product_candidates = [candidate for candidate in product_candidates if not candidate.failed]
        if not successful_product_candidates:
            selected_models[f"{product}|{variety}"] = {"strategy": "global", "model": best_global_name}
            registry_products[f"{product}|{variety}"] = {"strategy": "global", "artifactPath": "models/global/model.joblib"}
            continue
        product_model_df = _candidate_metrics(successful_product_candidates, product_split, config)
        product_baseline_mae = float(product_baseline_df.loc[product_baseline_df["model_name"] == "rolling_mean_7", "validation_MAE"].iloc[0])
        best_individual = choose_best_model(product_model_df.drop(columns=["estimator", "hyperparameters"]), product_baseline_mae)
        best_individual_name = best_individual["model_name"]
        individual_estimator = _model_lookup(product_model_df, best_individual_name, "estimator")
        individual_hyperparameters = _model_lookup(product_model_df, best_individual_name, "hyperparameters")
        global_subset = split.test[(split.test["product"] == product) & (split.test["variety"] == variety)].copy()
        global_subset_predictions = best_global_estimator.predict(global_subset[feature_spec["all"]])
        global_subset_metrics = regression_metrics(global_subset[config.targetColumn], global_subset_predictions, global_subset["price_rolling_mean_7"], config.directionalTolerance)
        chosen_strategy = "global" if global_subset_metrics["MAE"] <= best_individual["test_MAE"] else "individual"
        chosen_name = best_global_name if chosen_strategy == "global" else best_individual_name
        selected_models[f"{product}|{variety}"] = {"strategy": chosen_strategy, "model": chosen_name}
        chosen_estimator = best_global_estimator if chosen_strategy == "global" else individual_estimator
        chosen_features = feature_spec["all"] if chosen_strategy == "global" else product_features["all"]
        if chosen_strategy == "individual":
            product_candidate = next(candidate for candidate in successful_product_candidates if candidate.model_name == best_individual_name)
            individual_margin = residual_margin(product_split.validation[config.targetColumn].to_numpy(), product_candidate.validation_predictions, config.predictionIntervalConfidence)
            save_model_artifacts(paths.models_dir / "by_product" / product_slug, individual_estimator, {
                "modelName": best_individual_name,
                "strategy": "individual",
                "target": config.targetColumn,
                "trainingStartDate": str(product_split.train[config.dateColumn].min().date()),
                "trainingEndDate": str(product_split.train[config.dateColumn].max().date()),
                "validationStartDate": str(product_split.validation[config.dateColumn].min().date()),
                "validationEndDate": str(product_split.validation[config.dateColumn].max().date()),
                "testStartDate": str(product_split.test[config.dateColumn].min().date()),
                "testEndDate": str(product_split.test[config.dateColumn].max().date()),
                "features": product_features["all"],
                "metrics": best_individual.to_dict(),
                "baselineMetrics": product_baseline_df.to_dict(orient="records"),
                "hyperparameters": individual_hyperparameters,
                "randomSeed": config.randomSeed,
                "syntheticData": True,
                "limitations": LIMITATIONS,
            }, product_features["all"], individual_margin)
        feature_importance = _feature_importance_frame(chosen_estimator)
        feature_importance.to_csv(reports_training / f"feature_importance_{product_slug}.csv", index=False)
        _plot_bar(reports_training / f"feature_importance_{product_slug}.png", feature_importance["feature"].tolist(), feature_importance["importance"].tolist(), f"Feature Importance - {product}", "Importance")
        product_test = product_split.test.copy()
        predictions = chosen_estimator.predict(product_test[chosen_features])
        _plot_series(reports_training / f"actual_vs_predicted_{product_slug}.png", product_test[config.dateColumn], product_test[config.targetColumn], predictions, f"Actual vs Predicted - {product}")
        _plot_hist(reports_training / f"residual_distribution_{product_slug}.png", product_test[config.targetColumn] - predictions, f"Residual Distribution - {product}")
        _plot_series(reports_training / f"forecast_test_period_{product_slug}.png", product_test[config.dateColumn], product_test[config.targetColumn], predictions, f"Forecast Test Period - {product}")
        registry_products[f"{product}|{variety}"] = {"strategy": chosen_strategy, "artifactPath": f"models/{'global/model.joblib' if chosen_strategy == 'global' else f'by_product/{product_slug}/model.joblib'}"}
        metrics_by_product[f"{product}|{variety}"] = {"global": global_subset_metrics, "individual": best_individual.to_dict(), "selectedStrategy": chosen_strategy}
    write_registry(paths.models_dir, {"modelVersion": "1.0.0", "target": config.targetColumn, "trainedAt": pd.Timestamp.utcnow().isoformat(), "products": registry_products})
    (reports_training / "metrics_global.json").write_text(json.dumps(best_global.to_dict(), indent=2, default=str), encoding="utf-8")
    (reports_training / "metrics_by_product.json").write_text(json.dumps(metrics_by_product, indent=2, default=str), encoding="utf-8")
    (reports_training / "selected_models.json").write_text(json.dumps(selected_models, indent=2), encoding="utf-8")
    summary_lines = ["# Training Summary", "", "Synthetic data warning: all outputs in this phase come from synthetic data.", f"- Training rows: {len(split.train)}", f"- Validation rows: {len(split.validation)}", f"- Test rows: {len(split.test)}", f"- Best global model: {best_global_name}", f"- Best global validation MAE: {best_global['validation_MAE']:.4f}", "", "## Product Strategy"]
    for key, value in selected_models.items():
        summary_lines.append(f"- {key}: {value['strategy']} / {value['model']}")
    (reports_training / "training_summary.md").write_text("\n".join(summary_lines), encoding="utf-8")
    return {"config": config, "split": split, "baseline_df": baseline_df, "model_df": model_df.drop(columns=["estimator", "hyperparameters"]), "best_global": best_global.to_dict(), "selected_models": selected_models, "metrics_by_product": metrics_by_product}


def predict_latest(paths: ModelingPaths | None = None) -> pd.DataFrame:
    paths = paths or ModelingPaths()
    config = load_modeling_config(paths.config_path)
    datasets = load_processed_datasets(paths.processed_dir, config)
    registry = json.loads((paths.models_dir / "registry.json").read_text(encoding="utf-8"))
    inference = datasets.inference.copy()
    inference["product_key"] = inference["product"].astype(str) + "|" + inference["variety"].astype(str)
    expected_keys = list(registry["products"].keys())
    latest = inference.loc[inference["product_key"].isin(expected_keys)].sort_values(config.dateColumn).groupby("product_key", dropna=False).tail(1).copy()
    missing_keys = sorted(set(expected_keys) - set(latest["product_key"].tolist()))
    if missing_keys:
        raise KeyError(f"Missing inference rows for registered products: {missing_keys}")
    global_model = joblib.load(paths.models_dir / "global" / "model.joblib")
    global_margin = json.loads((paths.models_dir / "global" / "residuals.json").read_text(encoding="utf-8"))["margin"]
    global_metadata = json.loads((paths.models_dir / "global" / "metadata.json").read_text(encoding="utf-8"))
    global_features = json.loads((paths.models_dir / "global" / "feature_columns.json").read_text(encoding="utf-8"))
    rows = []
    for _, row in latest.iterrows():
        key = f"{row['product']}|{row['variety']}"
        model_info = registry["products"][key]
        if model_info["strategy"] == "individual":
            product_slug = slugify_product(row["product"], row["variety"])
            model_dir = paths.models_dir / "by_product" / product_slug
            model = joblib.load(model_dir / "model.joblib")
            margin = json.loads((model_dir / "residuals.json").read_text(encoding="utf-8"))["margin"]
            metadata = json.loads((model_dir / "metadata.json").read_text(encoding="utf-8"))
            feature_columns = json.loads((model_dir / "feature_columns.json").read_text(encoding="utf-8"))
        else:
            model = global_model
            margin = global_margin
            metadata = global_metadata
            feature_columns = global_features
        prediction = float(model.predict(pd.DataFrame([row[feature_columns].to_dict()]))[0])
        lower, upper = apply_interval(pd.Series([prediction]).to_numpy(), margin)
        rolling_mean_7 = float(row["price_rolling_mean_7"])
        predicted_change_percentage = 0.0 if abs(rolling_mean_7) < 1e-8 else ((prediction - rolling_mean_7) / rolling_mean_7)
        if rolling_mean_7 > 0 and (float(row["price_rolling_std_7"]) / rolling_mean_7) >= 0.10:
            recommendation = "MERCADO_INESTABLE"
        elif predicted_change_percentage >= 0.05:
            recommendation = "VENDER"
        elif predicted_change_percentage <= -0.05:
            recommendation = "ESPERAR"
        else:
            recommendation = "MANTENER"
        rows.append({
            "product": row["product"],
            "variety": row["variety"],
            "originDepartment": row["origin_department"],
            "originProvince": row["origin_province"],
            "market": row["market"],
            "forecastGeneratedAt": pd.Timestamp.utcnow().isoformat(),
            "forecastHorizonDays": 7,
            "lastObservedPricePerKg": float(row["avg_price_per_kg"]),
            "rollingMean7": rolling_mean_7,
            "predictedPricePerKg": prediction,
            "lowerBound": float(lower[0]),
            "upperBound": float(upper[0]),
            "predictedChangePercentage": predicted_change_percentage * 100,
            "recommendation": recommendation,
            "modelName": metadata["modelName"],
            "modelStrategy": metadata["strategy"],
            "modelVersion": registry["modelVersion"],
            "syntheticData": True,
        })
    prediction_df = pd.DataFrame(rows).sort_values(["product", "variety"]).reset_index(drop=True)
    prediction_dir = paths.reports_dir / "predictions"
    prediction_dir.mkdir(parents=True, exist_ok=True)
    prediction_df.to_csv(prediction_dir / "latest_predictions.csv", index=False)
    (prediction_dir / "latest_predictions.json").write_text(prediction_df.to_json(orient="records", indent=2), encoding="utf-8")
    return prediction_df


def main() -> None:
    train_and_evaluate()
    predict_latest()


if __name__ == "__main__":
    main()
