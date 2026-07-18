from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from .config import ModelingConfig


def _product_slug(product: str) -> str:
    return product.lower().replace(" ", "_")


def _save_plot(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()



def run_eda(df: pd.DataFrame, config: ModelingConfig, output_dir: Path) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "rows": int(len(df)),
        "columns": int(df.shape[1]),
        "dateRange": {"start": str(df[config.dateColumn].min().date()), "end": str(df[config.dateColumn].max().date())},
        "rowsByProduct": {key: int(value) for key, value in df.groupby("product").size().to_dict().items()},
        "rowsByMarket": {key: int(value) for key, value in df.groupby("market").size().to_dict().items()},
        "rowsByYearMonth": {f"{year}-{month:02d}": int(count) for (year, month), count in df.groupby([df[config.dateColumn].dt.year, df[config.dateColumn].dt.month]).size().to_dict().items()},
        "nulls": {key: int(value) for key, value in df.isna().sum().to_dict().items() if int(value) > 0},
        "duplicates": int(df.duplicated().sum()),
        "infiniteValues": int(pd.DataFrame(df.select_dtypes(include=["number"]).replace([float("inf"), float("-inf")], pd.NA)).isna().sum().sum()),
        "constantColumns": [column for column in df.columns if df[column].nunique(dropna=False) <= 1],
        "nearZeroVariance": [column for column in df.select_dtypes(include=["number"]).columns if float(df[column].std(ddof=0)) < 1e-8],
        "targetDescribe": df[config.targetColumn].describe().round(4).to_dict(),
        "trainableRows": int(df.dropna(subset=[config.targetColumn]).shape[0]),
        "syntheticWarning": "All analysis is based on synthetic data. Do not use for real commercial decisions.",
    }
    plt.figure(figsize=(8, 4))
    df.groupby("product").size().sort_values().plot(kind="bar")
    plt.title("Rows by Product")
    plt.ylabel("Rows")
    _save_plot(output_dir / "rows_by_product.png")
    plt.figure(figsize=(8, 4))
    df[config.targetColumn].plot(kind="hist", bins=40)
    plt.title("Target Distribution")
    plt.xlabel(config.targetColumn)
    _save_plot(output_dir / "target_distribution.png")
    for product, group in df.groupby("product"):
        slug = _product_slug(product)
        ordered = group.sort_values(config.dateColumn)
        plt.figure(figsize=(10, 4))
        plt.plot(ordered[config.dateColumn], ordered["avg_price_per_kg"], label="price")
        plt.plot(ordered[config.dateColumn], ordered["price_rolling_mean_7"], label="ma7")
        plt.plot(ordered[config.dateColumn], ordered["price_rolling_mean_30"], label="ma30")
        plt.legend()
        plt.title(f"Price Timeseries - {product}")
        _save_plot(output_dir / f"price_timeseries_{slug}.png")
        plt.figure(figsize=(8, 4))
        ordered["avg_price_per_kg"].plot(kind="hist", bins=30)
        plt.title(f"Price Distribution - {product}")
        _save_plot(output_dir / f"price_distribution_{slug}.png")
        plt.figure(figsize=(8, 4))
        ordered.groupby(ordered[config.dateColumn].dt.month)["avg_price_per_kg"].mean().plot(kind="bar")
        plt.title(f"Monthly Seasonality - {product}")
        _save_plot(output_dir / f"monthly_seasonality_{slug}.png")
        plt.figure(figsize=(8, 4))
        plt.scatter(ordered["volume_kg"], ordered["avg_price_per_kg"], alpha=0.5)
        plt.title(f"Volume vs Price - {product}")
        plt.xlabel("volume_kg")
        plt.ylabel("avg_price_per_kg")
        _save_plot(output_dir / f"volume_vs_price_{slug}.png")
        corr_columns = ["avg_price_per_kg", "volume_kg", "temp_avg_c", "precipitation_mm", "production_tons", "cost_per_kg"]
        correlation = ordered[corr_columns].corr(numeric_only=True)
        plt.figure(figsize=(6, 5))
        plt.imshow(correlation, cmap="coolwarm", vmin=-1, vmax=1)
        plt.xticks(range(len(corr_columns)), corr_columns, rotation=45, ha="right")
        plt.yticks(range(len(corr_columns)), corr_columns)
        plt.colorbar()
        plt.title(f"Correlation Matrix - {product}")
        _save_plot(output_dir / f"correlation_matrix_{slug}.png")
    (output_dir / "eda_report.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    summary_md = [
        "# EDA Summary",
        "",
        "Synthetic data warning: all conclusions are based on synthetic data and do not represent real market behavior.",
        "",
        f"- Rows: {summary['rows']}",
        f"- Columns: {summary['columns']}",
        f"- Date range: {summary['dateRange']['start']} to {summary['dateRange']['end']}",
        f"- Trainable rows: {summary['trainableRows']}",
        f"- Duplicates: {summary['duplicates']}",
        f"- Constant columns: {', '.join(summary['constantColumns']) if summary['constantColumns'] else 'None'}",
        "",
        "## Key Findings",
        "- Products have similar row counts but different price scales and logistics costs.",
        "- Time-based rolling features are strong candidates for modeling.",
        "- Raw identifiers and synthetic metadata fields should stay out of the feature set.",
        "- Leakage risk exists if future-aware columns or raw targets are reused as predictors.",
        "",
        "## Recommended Features",
        "- Lagged prices and volumes.",
        "- Rolling price, volume and weather statistics.",
        "- Calendar features and logistics costs.",
        "",
        "## Variables to Discard",
        "- generated_at_x, generated_at_y, source_x, source_y, is_synthetic_x, is_synthetic_y.",
        "- Target columns used as labels, never as predictors.",
    ]
    (output_dir / "eda_summary.md").write_text("\n".join(summary_md), encoding="utf-8")
    return summary
