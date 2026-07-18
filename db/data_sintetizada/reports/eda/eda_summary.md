# EDA Summary

Synthetic data warning: all conclusions are based on synthetic data and do not represent real market behavior.

- Rows: 4263
- Columns: 70
- Date range: 2024-01-31 to 2026-06-23
- Trainable rows: 4263
- Duplicates: 0
- Constant columns: market_city, source_x, is_synthetic_x, generated_at_x, vehicle_type, max_capacity_kg, source_y, is_synthetic_y, generated_at_y, logistics_is_outlier

## Key Findings
- Products have similar row counts but different price scales and logistics costs.
- Time-based rolling features are strong candidates for modeling.
- Raw identifiers and synthetic metadata fields should stay out of the feature set.
- Leakage risk exists if future-aware columns or raw targets are reused as predictors.

## Recommended Features
- Lagged prices and volumes.
- Rolling price, volume and weather statistics.
- Calendar features and logistics costs.

## Variables to Discard
- generated_at_x, generated_at_y, source_x, source_y, is_synthetic_x, is_synthetic_y.
- Target columns used as labels, never as predictors.