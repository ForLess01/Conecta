# Synthetic Dataset for agro-price-prediction

## Purpose

This dataset is fully synthetic and intended only for development, ETL validation,
feature engineering, model training experiments, API testing, and hackathon demos.
It must never be presented as official or real agricultural data.

## Multi-product scope

The generator now works from `config/products.json` and creates data for every product
listed there without hardcoding product-specific branching in the generator.

Initial configured products:

- Granada / Wonderful / Ica / Ica
- Papa / Yungay / Junin / Huancayo
- Palta / Hass / La Libertad / Viru
- Quinua / Blanca de Junin / Puno / Puno
- Pimiento / Paprika / Arequipa / Arequipa

All configured products use Lima as the destination city in the initial setup,
with daily prices, daily weather, monthly production, and monthly logistics costs.

## Generated files

The generator produces two aligned versions of the dataset:

- `data/synthetic_clean/`: normalized synthetic data without injected quality issues.
- `data/raw/`: the same synthetic base with controlled errors for ETL testing.

Generated files:

- `products.csv`
- `market_prices.csv`
- `weather_daily.csv`
- `crop_production_monthly.csv`
- `logistics_costs.csv`
- `data/metadata/synthetic_data_metadata.json`

## How generation works

The script uses deterministic random generation with a fixed seed.
The source of truth for product behavior is `config/products.json`, which defines:

- product identity and origin
- destination market and city
- base price range
- base daily volume range
- harvest peak months
- weather sensitivity
- supply-price elasticity
- planted area and yield baselines
- route distance and logistics baseline
- climate location metadata

Core patterns intentionally included:

- smooth temporal trend
- annual seasonality
- monthly production seasonality
- light weekly variation
- moderate random noise
- gradual logistics cost changes
- low-frequency climate events
- inverse relation between volume and price
- relation between production and daily market volume

## Cross-dataset relationships

The datasets are generated together rather than independently.

- `weather_daily.csv` is generated per configured `department/province` location.
- Weather stress influences later production through reduced harvested ratio and yield.
- `crop_production_monthly.csv` is generated per product using weather conditions from its origin.
- `market_prices.csv` uses each product's production and lagged weather stress to shape volume and price.
- `logistics_costs.csv` creates one monthly route per configured product origin to Lima.

## Controlled raw-data errors

The raw version intentionally includes a small number of issues:

- null values
- duplicate rows
- price outliers
- product and market name variations
- invalid dates
- inconsistent units

These issues are reproducible and limited. The purpose is to exercise ETL logic,
not to destroy the usefulness of the raw landing data.

## How to run the generator

From the project root:

```bash
python scripts/generate_synthetic_data.py --start-date 2024-01-01 --end-date 2026-06-30 --seed 42 --overwrite
```

Behavior:

- creates required output directories
- loads product definitions from `config/products.json`
- generates clean files first
- validates clean data before saving
- derives raw files with controlled errors
- writes metadata with record counts and parameters
- prints a summary of generated records and basic statistics

## Replacing synthetic data later

When real sources become available, keep the same file names and schemas whenever possible.
That will let the ETL, feature generation, model code, and API switch to real inputs with
minimal change.

Recommended path:

1. Preserve output schemas and primary field names.
2. Replace `data/synthetic_clean/` with standardized real extracts.
3. Replace `data/raw/` with source-system landing data.
4. Update metadata to reflect real origin, extraction date, and official status.
5. Expand or replace `config/products.json` as product onboarding evolves.

## Limitations

Synthetic data is helpful for development, but it has important limits:

- it does not represent real market behavior
- it may miss hidden drivers present in production data
- it can understate structural breaks
- it can make model quality look better than it would be on real-world data

Any metric obtained with this dataset should be treated only as a development signal.
It does not represent real production performance.
