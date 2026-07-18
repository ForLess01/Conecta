# agro-price-prediction

This workspace uses synthetic agricultural data for development only.
Do not use generated reports, metrics, models, predictions, or API responses for real commercial decisions.

## ETL

```bash
python scripts/run_etl.py --overwrite
```

## Exploratory analysis

```bash
python scripts/run_eda.py
```

## Training and evaluation

```bash
python scripts/train_models.py
python scripts/evaluate_models.py
```

## Latest predictions

```bash
python scripts/predict_latest.py
```

## End-to-end modeling pipeline

```bash
python -m src.modeling.pipeline
```

## REST API

Local run:

```bash
uvicorn src.api.main:app --reload
```

Docker:

```bash
docker compose up --build
```

Main endpoints:

- `GET /health`
- `GET /api/v1/products`
- `GET /api/v1/products/{product}/latest`
- `POST /api/v1/forecasts`
- `GET /api/v1/predictions`
- `GET /api/v1/predictions/{predictionId}`
- `GET /api/v1/models`

OpenAPI:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`
- `http://localhost:8000/openapi.json`

### JavaScript example

```javascript
const response = await fetch("http://localhost:8000/api/v1/forecasts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    product: "Granada",
    variety: "Wonderful",
    originDepartment: "Ica",
    originProvince: "Ica",
    destinationMarket: "Mercado Mayorista de Frutas",
    destinationCity: "Lima",
    forecastDays: 7,
    quantityKg: 1000
  })
});

if (!response.ok) {
  throw new Error("No se pudo obtener la prediccion");
}

const prediction = await response.json();

console.log(prediction.predictedWholesalePricePerKg);
console.log(prediction.estimatedFarmGatePricePerKg);
console.log(prediction.recommendation);
```

### React service example

```typescript
export interface ForecastRequest {
  product: string;
  variety: string;
  originDepartment: string;
  originProvince: string;
  destinationMarket: string;
  destinationCity: string;
  forecastDays: number;
  quantityKg?: number;
}

export async function createForecast(request: ForecastRequest) {
  const response = await fetch(
    `${import.meta.env.VITE_PREDICTION_API_URL}/api/v1/forecasts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message ?? "No se pudo generar la prediccion");
  }

  return response.json();
}
```

### Curl example

```bash
curl -X POST "http://localhost:8000/api/v1/forecasts" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Granada",
    "variety": "Wonderful",
    "originDepartment": "Ica",
    "originProvince": "Ica",
    "destinationMarket": "Mercado Mayorista de Frutas",
    "destinationCity": "Lima",
    "forecastDays": 7,
    "quantityKg": 1000
  }'
```
