from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query

from src.api.dependencies import get_prediction_service
from src.api.schemas.prediction import PredictionListResponse
from src.api.services.prediction_service import PredictionService

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("", response_model=PredictionListResponse, summary="List recent predictions")
def list_predictions(
    product: str | None = Query(default=None),
    variety: str | None = Query(default=None),
    recommendation: str | None = Query(default=None),
    dateFrom: datetime | None = Query(default=None),
    dateTo: datetime | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    prediction_service: PredictionService = Depends(get_prediction_service),
) -> PredictionListResponse:
    result = prediction_service.list_predictions(
        product=product,
        variety=variety,
        recommendation=recommendation,
        date_from=dateFrom,
        date_to=dateTo,
        page=page,
        page_size=pageSize,
    )
    return PredictionListResponse(
        items=[record.response_payload for record in result["items"]],
        page=result["page"],
        pageSize=result["page_size"],
        total=result["total"],
        totalPages=result["total_pages"],
    )


@router.get("/{predictionId}", response_model=dict, summary="Get a prediction by id")
def get_prediction(predictionId: str, prediction_service: PredictionService = Depends(get_prediction_service)) -> dict:
    return prediction_service.get_prediction(predictionId)
