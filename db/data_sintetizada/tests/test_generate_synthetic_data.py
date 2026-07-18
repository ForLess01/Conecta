from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

import pandas as pd

SCRIPT_PATH = Path(__file__).resolve().parent.parent / "scripts" / "generate_synthetic_data.py"
CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "products.json"
START_DATE = "2024-01-01"
END_DATE = "2026-06-30"


def load_generator_module():
    spec = importlib.util.spec_from_file_location("generate_synthetic_data", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def load_products_config() -> list[dict]:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8-sig"))["products"]


def file_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def expected_day_count(start_date: str, end_date: str) -> int:
    return len(pd.date_range(start=start_date, end=end_date, freq="D"))


def expected_month_count(start_date: str, end_date: str) -> int:
    return len(pd.date_range(start=start_date, end=end_date, freq="MS"))


def generated_paths(output_root: Path) -> dict[str, Path]:
    return {
        "clean_products": output_root / "data" / "synthetic_clean" / "products.csv",
        "clean_market": output_root / "data" / "synthetic_clean" / "market_prices.csv",
        "clean_weather": output_root / "data" / "synthetic_clean" / "weather_daily.csv",
        "clean_crop": output_root / "data" / "synthetic_clean" / "crop_production_monthly.csv",
        "clean_logistics": output_root / "data" / "synthetic_clean" / "logistics_costs.csv",
        "raw_products": output_root / "data" / "raw" / "products.csv",
        "raw_market": output_root / "data" / "raw" / "market_prices.csv",
        "raw_weather": output_root / "data" / "raw" / "weather_daily.csv",
        "raw_crop": output_root / "data" / "raw" / "crop_production_monthly.csv",
        "raw_logistics": output_root / "data" / "raw" / "logistics_costs.csv",
        "metadata": output_root / "data" / "metadata" / "synthetic_data_metadata.json",
    }


def run_generation(tmp_path: Path, seed: int = 42) -> dict:
    module = load_generator_module()
    return module.generate_synthetic_data(
        start_date=START_DATE,
        end_date=END_DATE,
        seed=seed,
        output_root=tmp_path,
        overwrite=True,
    )


def test_reproducibility_with_same_seed(tmp_path: Path) -> None:
    run_generation(tmp_path / "run_a", seed=42)
    run_generation(tmp_path / "run_b", seed=42)
    for key, path_a in generated_paths(tmp_path / "run_a").items():
        if key == "metadata":
            continue
        path_b = generated_paths(tmp_path / "run_b")[key]
        assert file_digest(path_a) == file_digest(path_b)


def test_different_seed_changes_output(tmp_path: Path) -> None:
    run_generation(tmp_path / "run_a", seed=42)
    run_generation(tmp_path / "run_b", seed=99)
    assert file_digest(generated_paths(tmp_path / "run_a")["clean_market"]) != file_digest(generated_paths(tmp_path / "run_b")["clean_market"])


def test_all_expected_files_exist(tmp_path: Path) -> None:
    run_generation(tmp_path)
    for path in generated_paths(tmp_path).values():
        assert path.exists(), f"Missing file: {path}"


def test_expected_record_counts(tmp_path: Path) -> None:
    run_generation(tmp_path)
    products_config = load_products_config()
    product_count = len(products_config)
    location_count = len({(product["originDepartment"], product["originProvince"]) for product in products_config})
    paths = generated_paths(tmp_path)
    clean_products = pd.read_csv(paths["clean_products"])
    clean_market = pd.read_csv(paths["clean_market"])
    clean_weather = pd.read_csv(paths["clean_weather"])
    clean_crop = pd.read_csv(paths["clean_crop"])
    clean_logistics = pd.read_csv(paths["clean_logistics"])
    assert len(clean_products) == product_count
    assert len(clean_market) == expected_day_count(START_DATE, END_DATE) * product_count
    assert len(clean_weather) == expected_day_count(START_DATE, END_DATE) * location_count
    assert len(clean_crop) == expected_month_count(START_DATE, END_DATE) * product_count
    assert len(clean_logistics) == expected_month_count(START_DATE, END_DATE) * product_count


def test_price_integrity(tmp_path: Path) -> None:
    run_generation(tmp_path)
    clean_market = pd.read_csv(generated_paths(tmp_path)["clean_market"])
    assert (clean_market["min_price_per_kg"] <= clean_market["avg_price_per_kg"]).all()
    assert (clean_market["avg_price_per_kg"] <= clean_market["max_price_per_kg"]).all()
    assert (clean_market[["min_price_per_kg", "avg_price_per_kg", "max_price_per_kg"]] >= 0).all().all()
    assert (clean_market["volume_kg"] >= 0).all()
    assert clean_market["product"].nunique() == len(load_products_config())


def test_temperature_integrity(tmp_path: Path) -> None:
    run_generation(tmp_path)
    clean_weather = pd.read_csv(generated_paths(tmp_path)["clean_weather"])
    assert (clean_weather["temp_min_c"] <= clean_weather["temp_avg_c"]).all()
    assert (clean_weather["temp_avg_c"] <= clean_weather["temp_max_c"]).all()


def test_production_integrity(tmp_path: Path) -> None:
    run_generation(tmp_path)
    clean_crop = pd.read_csv(generated_paths(tmp_path)["clean_crop"])
    assert (clean_crop["harvested_area_ha"] <= clean_crop["planted_area_ha"]).all()
    assert (clean_crop["production_tons"] >= 0).all()
    recomputed = (clean_crop["harvested_area_ha"] * clean_crop["yield_tons_per_ha"]).round(2)
    assert recomputed.equals(clean_crop["production_tons"].round(2))


def test_logistics_integrity(tmp_path: Path) -> None:
    run_generation(tmp_path)
    clean_logistics = pd.read_csv(generated_paths(tmp_path)["clean_logistics"])
    recomputed = (clean_logistics["max_capacity_kg"] * clean_logistics["cost_per_kg"]).round(2)
    assert (clean_logistics["cost_per_kg"] >= 0).all()
    assert recomputed.equals(clean_logistics["total_transport_cost"].round(2))


def test_clean_dates_are_complete_and_valid(tmp_path: Path) -> None:
    run_generation(tmp_path)
    products_config = load_products_config()
    day_count = expected_day_count(START_DATE, END_DATE)
    month_count = expected_month_count(START_DATE, END_DATE)
    clean_market = pd.read_csv(generated_paths(tmp_path)["clean_market"])
    clean_weather = pd.read_csv(generated_paths(tmp_path)["clean_weather"])
    clean_crop = pd.read_csv(generated_paths(tmp_path)["clean_crop"])
    assert pd.to_datetime(clean_market["date"], errors="raise").notna().all()
    assert pd.to_datetime(clean_weather["date"], errors="raise").notna().all()
    for product in products_config:
        subset = clean_market[
            (clean_market["product"] == product["name"])
            & (clean_market["variety"] == product["variety"])
            & (clean_market["origin_department"] == product["originDepartment"])
            & (clean_market["origin_province"] == product["originProvince"])
        ]
        assert len(subset) == day_count
    for product in products_config:
        subset = clean_crop[
            (clean_crop["product"] == product["name"])
            & (clean_crop["variety"] == product["variety"])
            & (clean_crop["department"] == product["originDepartment"])
            & (clean_crop["province"] == product["originProvince"])
        ]
        assert len(subset) == month_count


def test_raw_contains_controlled_errors(tmp_path: Path) -> None:
    run_generation(tmp_path)
    products_config = load_products_config()
    product_count = len(products_config)
    location_count = len({(product["originDepartment"], product["originProvince"]) for product in products_config})
    raw_products = pd.read_csv(generated_paths(tmp_path)["raw_products"])
    raw_market = pd.read_csv(generated_paths(tmp_path)["raw_market"])
    raw_weather = pd.read_csv(generated_paths(tmp_path)["raw_weather"])
    assert len(raw_market) > expected_day_count(START_DATE, END_DATE) * product_count
    assert len(raw_weather) > expected_day_count(START_DATE, END_DATE) * location_count
    assert raw_market.isna().sum().sum() > 0 or raw_weather.isna().sum().sum() > 0
    assert raw_products["standard_unit"].iloc[0] != "kg"
    assert pd.to_datetime(raw_market["date"], errors="coerce").isna().sum() >= 2
    assert pd.to_datetime(raw_weather["date"], errors="coerce").isna().sum() >= 1
    assert raw_market["product"].astype(str).str.contains("GRANADA|granada|Wonderful|PAPA|palta", regex=True).any()


def test_clean_has_no_intentional_raw_errors(tmp_path: Path) -> None:
    run_generation(tmp_path)
    clean_products = pd.read_csv(generated_paths(tmp_path)["clean_products"])
    clean_market = pd.read_csv(generated_paths(tmp_path)["clean_market"])
    clean_weather = pd.read_csv(generated_paths(tmp_path)["clean_weather"])
    config_df = pd.DataFrame(load_products_config())
    assert clean_products["standard_unit"].eq("kg").all()
    assert clean_products["currency"].eq("PEN").all()
    assert clean_market.isna().sum().sum() == 0
    assert clean_weather.isna().sum().sum() == 0
    assert pd.to_datetime(clean_market["date"], errors="coerce").notna().all()
    assert pd.to_datetime(clean_weather["date"], errors="coerce").notna().all()
    assert set(clean_market["product"].unique()) == set(config_df["name"].unique())


def test_metadata_contains_requested_fields(tmp_path: Path) -> None:
    result = run_generation(tmp_path)
    metadata = json.loads(generated_paths(tmp_path)["metadata"].read_text(encoding="utf-8"))
    assert metadata["datasetType"] == "synthetic"
    assert metadata["officialData"] is False
    assert metadata["randomSeed"] == 42
    assert metadata["generatorVersion"] == "1.1.0"
    assert metadata["generatedAt"] == result["generated_at"]
    assert metadata["productCount"] == len(load_products_config())
    assert len(metadata["products"]) == len(load_products_config())
    assert metadata["recordCounts"]["synthetic_clean"]["products.csv"] == len(load_products_config())
