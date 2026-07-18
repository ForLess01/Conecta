from .forecasts import router as forecasts_router
from .health import router as health_router
from .models import router as models_router
from .predictions import router as predictions_router
from .products import router as products_router

__all__ = [
    "forecasts_router",
    "health_router",
    "models_router",
    "predictions_router",
    "products_router",
]
