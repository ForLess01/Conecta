from __future__ import annotations


def test_cors_preflight(client):
    response = client.options(
        '/api/v1/products',
        headers={
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
        },
    )
    assert response.status_code == 200
    assert response.headers['access-control-allow-origin'] == 'http://localhost:3000'


def test_openapi_available(client):
    response = client.get('/openapi.json')
    assert response.status_code == 200
    payload = response.json()
    assert '/api/v1/forecasts' in payload['paths']
