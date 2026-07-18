from __future__ import annotations

from fastapi import APIRouter, Depends

from src.api.dependencies import get_model_registry_service, get_settings
from src.api.schemas.common import HealthResponse
from src.api.services.model_registry_service import ModelRegistryService

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health",
    description="Returns the API health and whether the model registry can be reached.",
)
def health(model_registry_service: ModelRegistryService = Depends(get_model_registry_service)) -> HealthResponse:
    settings = get_settings()
    model_registry_service.load_registry()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        modelsLoaded=True,
    )
