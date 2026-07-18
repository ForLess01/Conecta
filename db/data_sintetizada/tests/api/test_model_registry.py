from __future__ import annotations


def test_models_endpoint(client):
    response = client.get('/api/v1/models')
    assert response.status_code == 200
    payload = response.json()
    assert payload['modelVersion'] == '1.0.0'
    assert len(payload['items']) == 5
    assert all(item['modelAvailable'] for item in payload['items'])
