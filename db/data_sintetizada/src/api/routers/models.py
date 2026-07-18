from __future__ import annotations

from fastapi import APIRouter, Depends

from src.api.dependencies import get_model_registry_service
from src.api.schemas.model import ModelCatalogResponse
from src.api.services.model_registry_service import ModelRegistryService

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=ModelCatalogResponse, summary="List model information")
def list_models(model_registry_service: ModelRegistryService = Depends(get_model_registry_service)) -> ModelCatalogResponse:
    registry = model_registry_service.load_registry()
    return ModelCatalogResponse(
        modelVersion=str(registry.get("modelVersion", "1.0.0")),
        target=str(registry.get("target", "target_price_next_7_days")),
        trainedAt=str(registry.get("trainedAt", "")),
        syntheticData=True,
        items=model_registry_service.list_model_items(),
    )
