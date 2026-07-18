from __future__ import annotations


def test_list_products(client):
    response = client.get('/api/v1/products')
    assert response.status_code == 200
    payload = response.json()
    assert payload['total'] == 5
    keys = {(item['product'], item['variety']) for item in payload['items']}
    assert keys == {
        ('Granada', 'Wonderful'),
        ('Papa', 'Yungay'),
        ('Palta', 'Hass'),
        ('Quinua', 'Blanca De Junin'),
        ('Pimiento', 'Paprika'),
    }


def test_latest_product(client):
    response = client.get('/api/v1/products/Granada/latest', params={'variety': 'Wonderful'})
    assert response.status_code == 200
    payload = response.json()
    assert payload['product'] == 'Granada'
    assert payload['variety'] == 'Wonderful'
    assert payload['syntheticData'] is True


def test_product_not_found(client):
    response = client.get('/api/v1/products/Mango/latest', params={'variety': 'Kent'})
    assert response.status_code == 404
    assert response.json()['error']['code'] == 'PRODUCT_NOT_FOUND'
