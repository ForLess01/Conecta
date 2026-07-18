from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from .cleaners import (
    append_rejections,
    apply_integrity_rules,
    coerce_dates,
    coerce_numeric,
    detect_outliers,
    drop_required_nulls,
    enrich_products_from_reference,
    impute_optional_numerics,
    remove_duplicates,
    summarize_nulls,
)
from .config import ETLSettings, load_aliases, load_product_reference
from .feature_engineering import create_features, split_training_and_inference
from .mergers import merge_with_logistics, merge_with_production, merge_with_weather
from .normalizers import normalize_frame
from .quality_report import create_report, finalize_report, write_report
from .readers import read_raw_tables
from .validators import ETLValidationError, validate_input_files, validate_output_targets, validate_required_columns

logger = logging.getLogger(__name__)


def _save_rejections(output_dir: Path, rejections: list[dict]) -> None:
    rejected_rows_path = output_dir / "rejected_rows.csv"
    if rejections:
        rows = []
        for item in rejections:
            row = {"source_file": item["source_file"], "stage": item["stage"], "reason": item["reason"]}
            for key, value in item["row_data"].items():
                row[f"row_{key}"] = value
            rows.append(row)
        pd.DataFrame(rows).to_csv(rejected_rows_path, index=False)
    else:
        pd.DataFrame(columns=["source_file", "stage", "reason"]).to_csv(rejected_rows_path, index=False)


def run_pipeline(settings: ETLSettings | None = None) -> dict[str, object]:
    settings = settings or ETLSettings()
    report = create_report()
    rejections: list[dict] = []
    logger.info("Starting ETL pipeline")
    try:
        input_paths = validate_input_files(settings.paths.input_dir)
        validate_output_targets(settings.paths.output_dir, settings.paths.overwrite)
        report.inputFiles = {key: str(path) for key, path in input_paths.items()}
        aliases = load_aliases(settings.paths.alias_config_path)
        product_reference = load_product_reference(settings.paths.product_config_path)
        tables = read_raw_tables(settings.paths.input_dir)
        tables["products"] = enrich_products_from_reference(tables["products"], product_reference)
        for name, df in tables.items():
            validate_required_columns(name, df)
            report.rowsRead[name] = int(len(df))
            report.nullValuesBefore[name] = summarize_nulls(df)
        cleaned_tables: dict[str, pd.DataFrame] = {}
        for name, df in tables.items():
            normalized = normalize_frame(name, df, aliases)
            deduped, duplicates_removed = remove_duplicates(name, normalized)
            report.duplicatesRemoved[name] = duplicates_removed
            if name in {"market_prices", "weather_daily", "logistics_costs"}:
                deduped = coerce_dates(name, deduped, settings.max_invalid_date_ratio, rejections)
            deduped = coerce_numeric(name, deduped, rejections)
            if name == "market_prices":
                deduped = drop_required_nulls(deduped, rejections)
            deduped, imputed_count = impute_optional_numerics(name, deduped)
            report.imputedValues[name] = imputed_count
            deduped = apply_integrity_rules(name, deduped, rejections)
            report.invalidRows[name] = report.rowsRead[name] - len(deduped) - report.duplicatesRemoved.get(name, 0)
            report.nullValuesAfter[name] = summarize_nulls(deduped)
            cleaned_tables[name] = deduped
        market = cleaned_tables["market_prices"].copy()
        mild_outlier, extreme_outlier = detect_outliers(market, "avg_price_per_kg", ["product", "variety", "origin_department"])
        volume_mild, volume_extreme = detect_outliers(market, "volume_kg", ["product", "variety", "origin_department"])
        market["is_outlier"] = (mild_outlier | volume_mild).astype(bool)
        extreme_mask = (extreme_outlier | volume_extreme)
        append_rejections(rejections, "market_prices", "outlier_policy", "extreme_outlier", market.loc[extreme_mask])
        report.outliersDetected["market_prices"] = int(market["is_outlier"].sum())
        report.outliersRemoved["market_prices"] = int(extreme_mask.sum())
        cleaned_tables["market_prices"] = market.loc[~extreme_mask].copy()
        crop = cleaned_tables["crop_production_monthly"].copy()
        crop_mild, crop_extreme = detect_outliers(crop, "production_tons", ["product", "variety", "department"])
        crop["production_is_outlier"] = crop_mild.astype(bool)
        append_rejections(rejections, "crop_production_monthly", "outlier_policy", "extreme_outlier", crop.loc[crop_extreme])
        report.outliersDetected["crop_production_monthly"] = int(crop_mild.sum())
        report.outliersRemoved["crop_production_monthly"] = int(crop_extreme.sum())
        cleaned_tables["crop_production_monthly"] = crop.loc[~crop_extreme].copy()
        logistics = cleaned_tables["logistics_costs"].copy()
        log_mild, log_extreme = detect_outliers(logistics, "cost_per_kg", ["origin_department", "origin_province", "destination_city"])
        logistics["logistics_is_outlier"] = log_mild.astype(bool)
        append_rejections(rejections, "logistics_costs", "outlier_policy", "extreme_outlier", logistics.loc[log_extreme])
        report.outliersDetected["logistics_costs"] = int(log_mild.sum())
        report.outliersRemoved["logistics_costs"] = int(log_extreme.sum())
        cleaned_tables["logistics_costs"] = logistics.loc[~log_extreme].copy()
        merged = merge_with_weather(cleaned_tables["market_prices"], cleaned_tables["weather_daily"])
        merged = merge_with_production(merged, cleaned_tables["crop_production_monthly"])
        merged = merge_with_logistics(merged, cleaned_tables["logistics_costs"])
        production_flags = merged["production_is_outlier"] if "production_is_outlier" in merged.columns else pd.Series(False, index=merged.index, dtype=bool)
        logistics_flags = merged["logistics_is_outlier"] if "logistics_is_outlier" in merged.columns else pd.Series(False, index=merged.index, dtype=bool)
        merged["is_outlier"] = merged["is_outlier"].astype("boolean").fillna(False) | production_flags.astype("boolean").fillna(False) | logistics_flags.astype("boolean").fillna(False)
        report.rowsMerged = int(len(merged))
        featured = create_features(merged)
        training, inference = split_training_and_inference(featured)
        report.trainingRows = int(len(training))
        report.inferenceRows = int(len(inference))
        summary = inference.groupby("product").agg(rows=("product", "size"), training_rows=("target_price_next_day", lambda series: int(series.notna().sum()))).to_dict(orient="index")
        report.productSummary = {key: {inner_key: int(inner_value) for inner_key, inner_value in value.items()} for key, value in summary.items()}
        output_dir = settings.paths.output_dir
        output_dir.mkdir(parents=True, exist_ok=True)
        training.to_csv(output_dir / "training_dataset.csv", index=False)
        training.to_parquet(output_dir / "training_dataset.parquet", index=False)
        inference.to_csv(output_dir / "inference_dataset.csv", index=False)
        _save_rejections(output_dir, rejections)
        finalize_report(report, "SUCCESS")
        write_report(report, output_dir / "etl_quality_report.json")
        return {
            "training_dataset": training,
            "inference_dataset": inference,
            "quality_report": report,
            "rejections": pd.read_csv(output_dir / "rejected_rows.csv"),
        }
    except Exception as exc:
        logger.exception("ETL pipeline failed")
        report.notes.append(str(exc))
        finalize_report(report, "FAILED")
        settings.paths.output_dir.mkdir(parents=True, exist_ok=True)
        _save_rejections(settings.paths.output_dir, rejections)
        write_report(report, settings.paths.output_dir / "etl_quality_report.json")
        raise ETLValidationError(str(exc)) from exc
