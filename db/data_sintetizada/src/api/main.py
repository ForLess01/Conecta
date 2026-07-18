from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .dependencies import get_settings
from .exception_handlers import register_exception_handlers
from .infrastructure.logging import configure_logging
from .middleware import add_middleware
from .routers.forecasts import router as forecasts_router
from .routers.health import router as health_router
from .routers.models import router as models_router
from .routers.predictions import router as predictions_router
from .routers.products import router as products_router

configure_logging()
settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    description="REST API for synthetic agricultural wholesale price forecasts.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
add_middleware(app)
register_exception_handlers(app)
app.include_router(health_router)
app.include_router(products_router, prefix=settings.api_prefix)
app.include_router(forecasts_router, prefix=settings.api_prefix)
app.include_router(predictions_router, prefix=settings.api_prefix)
app.include_router(models_router, prefix=settings.api_prefix)
