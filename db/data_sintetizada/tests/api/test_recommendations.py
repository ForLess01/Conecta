from __future__ import annotations

from src.api.dependencies import get_model_cache, get_pricing_service, get_recommendation_service


def test_farm_gate_price_calculation():
    service = get_pricing_service()
    farm_gate, costs = service.calculate_farm_gate_price(
        predicted_wholesale_price_per_kg=5.06,
        logistics_cost_per_kg=0.34,
    )
    assert round(costs.estimated_loss_cost_per_kg, 2) == 0.15
    assert farm_gate >= 0


def test_quantity_analysis_calculation():
    service = get_pricing_service()
    payload = service.calculate_quantity_analysis(
        quantity_kg=1000,
        predicted_wholesale_price_per_kg=5.0,
        estimated_farm_gate_price_per_kg=4.0,
        lower_bound_per_kg=4.5,
        upper_bound_per_kg=5.5,
    )
    assert payload['estimatedWholesaleRevenue'] == 5000.0
    assert payload['estimatedFarmGateRevenue'] == 4000.0


def test_recommendation_sell_rule():
    service = get_recommendation_service()
    recommendation, _ = service.build_recommendation(predicted_price=5.5, rolling_mean_7=5.0, rolling_std_7=0.2)
    assert recommendation == 'VENDER'


def test_recommendation_wait_rule():
    service = get_recommendation_service()
    recommendation, _ = service.build_recommendation(predicted_price=4.5, rolling_mean_7=5.0, rolling_std_7=0.2)
    assert recommendation == 'ESPERAR'


def test_recommendation_hold_rule():
    service = get_recommendation_service()
    recommendation, _ = service.build_recommendation(predicted_price=5.02, rolling_mean_7=5.0, rolling_std_7=0.2)
    assert recommendation == 'MANTENER'


def test_recommendation_unstable_market_rule():
    service = get_recommendation_service()
    recommendation, _ = service.build_recommendation(predicted_price=5.5, rolling_mean_7=5.0, rolling_std_7=0.6)
    assert recommendation == 'MERCADO_INESTABLE'


def test_model_cache_reuses_loaded_models():
    cache = get_model_cache()
    cache.clear()
    first = cache.get_or_load(product='Granada', variety='Wonderful', strategy='global', model_version='1.0.0')
    second = cache.get_or_load(product='Quinua', variety='Blanca De Junin', strategy='global', model_version='1.0.0')
    assert first is second
    assert cache.loaded_models() == ['global:models/global']
