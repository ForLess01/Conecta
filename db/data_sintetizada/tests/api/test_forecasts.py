from __future__ import annotations

from src.api.dependencies import get_prediction_service
from src.api.exception_handlers import ApiError


class ErrorPredictionService:
    def __init__(self, code: str, status_code: int, message: str):
        self.code = code
        self.status_code = status_code
        self.message = message

    def create_forecast(self, _payload):
        raise ApiError(code=self.code, message=self.message, status_code=self.status_code)


def test_valid_forecast(client, forecast_payload):
    response = client.post('/api/v1/forecasts', json=forecast_payload)
    assert response.status_code == 201
    payload = response.json()
    assert payload['product'] == 'Granada'
    assert payload['quantityAnalysis']['quantityKg'] == 1000
    assert payload['estimatedFarmGatePricePerKg'] >= 0
    assert payload['lowerBoundPerKg'] >= 0
    assert payload['syntheticData'] is True


def test_model_not_found(client, forecast_payload):
    from src.api.main import app

    app.dependency_overrides[get_prediction_service] = lambda: ErrorPredictionService(
        code='MODEL_NOT_FOUND',
        status_code=404,
        message='No existe un modelo disponible para el producto solicitado.',
    )
    response = client.post('/api/v1/forecasts', json=forecast_payload)
    app.dependency_overrides.clear()
    assert response.status_code == 404
    assert response.json()['error']['code'] == 'MODEL_NOT_FOUND'


def test_incomplete_inference_data(client, forecast_payload):
    from src.api.main import app

    app.dependency_overrides[get_prediction_service] = lambda: ErrorPredictionService(
        code='FEATURES_NOT_AVAILABLE',
        status_code=503,
        message='The inference dataset does not contain all required features.',
    )
    response = client.post('/api/v1/forecasts', json=forecast_payload)
    app.dependency_overrides.clear()
    assert response.status_code == 503
    assert response.json()['error']['code'] == 'FEATURES_NOT_AVAILABLE'


def test_validation_error_on_quantity(client, forecast_payload):
    forecast_payload['quantityKg'] = 0
    response = client.post('/api/v1/forecasts', json=forecast_payload)
    assert response.status_code == 422
    assert response.json()['error']['code'] == 'VALIDATION_ERROR'
