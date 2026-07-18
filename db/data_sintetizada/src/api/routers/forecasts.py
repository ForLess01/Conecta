from __future__ import annotations

from fastapi import APIRouter, Depends, status

from src.api.dependencies import get_prediction_service
from src.api.schemas.forecast import ForecastRequest, ForecastResponse
from src.api.services.prediction_service import PredictionService

router = APIRouter(prefix="/forecasts", tags=["forecasts"])


@router.post(
    "",
    response_model=ForecastResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a forecast",
    description="Generates a forecast from the latest available observation and persists it.",
)
def create_forecast(payload: ForecastRequest, prediction_service: PredictionService = Depends(get_prediction_service)) -> ForecastResponse:
    return ForecastResponse(**prediction_service.create_forecast(payload))
