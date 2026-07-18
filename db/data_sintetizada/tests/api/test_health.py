from __future__ import annotations


def test_health(client):
    response = client.get('/health')
    assert response.status_code == 200
    payload = response.json()
    assert payload['status'] == 'ok'
    assert payload['service'] == 'Agro Price Prediction API'
    assert payload['modelsLoaded'] is True
