from __future__ import annotations


def _create_prediction(client, payload):
    response = client.post('/api/v1/forecasts', json=payload)
    assert response.status_code == 201
    return response.json()


def test_prediction_persistence_and_get_by_id(client, forecast_payload):
    created = _create_prediction(client, forecast_payload)
    response = client.get(f"/api/v1/predictions/{created['predictionId']}")
    assert response.status_code == 200
    assert response.json()['predictionId'] == created['predictionId']


def test_prediction_pagination(client, forecast_payload):
    _create_prediction(client, forecast_payload)
    alt = {**forecast_payload, 'product': 'Palta', 'variety': 'Hass', 'originDepartment': 'La Libertad', 'originProvince': 'Viru'}
    _create_prediction(client, alt)
    response = client.get('/api/v1/predictions', params={'page': 1, 'pageSize': 1})
    assert response.status_code == 200
    payload = response.json()
    assert payload['page'] == 1
    assert payload['pageSize'] == 1
    assert payload['total'] == 2
    assert payload['totalPages'] == 2
    assert len(payload['items']) == 1


def test_prediction_not_found(client):
    response = client.get('/api/v1/predictions/does-not-exist')
    assert response.status_code == 404
