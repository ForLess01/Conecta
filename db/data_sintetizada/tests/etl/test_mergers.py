import pandas as pd

from src.etl.mergers import merge_with_logistics, merge_with_production, merge_with_weather


def test_merge_weather() -> None:
    market = pd.DataFrame({"date": ["2024-01-01"], "origin_department": ["Ica"], "origin_province": ["Ica"]})
    weather = pd.DataFrame({"date": ["2024-01-01"], "department": ["Ica"], "province": ["Ica"], "temp_min_c": [10], "temp_max_c": [20], "temp_avg_c": [15], "precipitation_mm": [0.0], "humidity_avg": [60], "wind_speed_kmh": [12]})
    merged = merge_with_weather(market, weather)
    assert merged["temp_avg_c"].iloc[0] == 15


def test_merge_production() -> None:
    market = pd.DataFrame({"date": ["2024-01-15"], "product": ["Granada"], "variety": ["Wonderful"], "origin_department": ["Ica"], "origin_province": ["Ica"]})
    production = pd.DataFrame({"year": [2024], "month": [1], "product": ["Granada"], "variety": ["Wonderful"], "department": ["Ica"], "province": ["Ica"], "planted_area_ha": [100], "harvested_area_ha": [90], "production_tons": [1000], "yield_tons_per_ha": [11.1]})
    merged = merge_with_production(market, production)
    assert merged["production_tons"].iloc[0] == 1000


def test_merge_logistics() -> None:
    market = pd.DataFrame({"date": ["2024-01-15"], "origin_department": ["Ica"], "origin_province": ["Ica"], "market_city": ["Lima"]})
    logistics = pd.DataFrame({"origin_department": ["Ica"], "origin_province": ["Ica"], "destination_city": ["Lima"], "valid_from": ["2024-01-01"], "valid_to": ["2024-01-31"], "cost_per_kg": [0.4], "distance_km": [305], "vehicle_type": ["Truck"], "max_capacity_kg": [10000], "total_transport_cost": [4000], "fuel_price_index": [1.0], "source": ["S"], "is_synthetic": [True], "generated_at": ["2024-01-31"]})
    merged = merge_with_logistics(market, logistics)
    assert merged["cost_per_kg"].iloc[0] == 0.4
