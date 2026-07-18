from __future__ import annotations

from pydantic import BaseModel

from .common import DestinationInfo, OriginInfo


class ProductItem(BaseModel):
    product: str
    variety: str
    originDepartment: str
    originProvince: str
    destinationMarket: str
    destinationCity: str
    modelAvailable: bool


class ProductListResponse(BaseModel):
    items: list[ProductItem]
    total: int


class LatestObservationResponse(BaseModel):
    product: str
    variety: str
    date: str
    origin: OriginInfo
    destination: DestinationInfo
    lastObservedPricePerKg: float
    minimumObservedPricePerKg: float
    maximumObservedPricePerKg: float
    rollingMean7: float
    rollingMean30: float
    volumeKg: float
    logisticsCostPerKg: float
    syntheticData: bool
