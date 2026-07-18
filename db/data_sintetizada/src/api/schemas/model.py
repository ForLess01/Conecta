from __future__ import annotations

from pydantic import BaseModel


class ModelCatalogItem(BaseModel):
    product: str
    variety: str
    strategy: str
    modelName: str
    mae: float
    rmse: float
    mape: float
    modelAvailable: bool


class ModelCatalogResponse(BaseModel):
    modelVersion: str
    target: str
    trainedAt: str
    syntheticData: bool
    items: list[ModelCatalogItem]
