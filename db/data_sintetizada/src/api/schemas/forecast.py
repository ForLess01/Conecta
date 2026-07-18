from __future__ import annotations

from pydantic import BaseModel, Field, PositiveFloat, field_validator

from .common import DestinationInfo, OriginInfo


class ForecastRequest(BaseModel):
    product: str = Field(min_length=1)
    variety: str = Field(min_length=1)
    originDepartment: str = Field(min_length=1)
    originProvince: str = Field(min_length=1)
    destinationMarket: str = Field(min_length=1)
    destinationCity: str = Field(min_length=1)
    forecastDays: int = Field(default=7, ge=1, le=30)
    quantityKg: PositiveFloat | None = None


class ConfidenceInfo(BaseModel):
    level: float
    label: str


class CostBreakdownResponse(BaseModel):
    logisticsCostPerKg: float
    commissionCostPerKg: float
    handlingCostPerKg: float
    estimatedLossCostPerKg: float


class QuantityAnalysisResponse(BaseModel):
    quantityKg: float
    estimatedWholesaleRevenue: float
    estimatedFarmGateRevenue: float
    lowerEstimatedRevenue: float
    upperEstimatedRevenue: float


class ForecastModelInfo(BaseModel):
    name: str
    strategy: str
    version: str


class ForecastResponse(BaseModel):
    predictionId: str
    product: str
    variety: str
    origin: OriginInfo
    destination: DestinationInfo
    lastObservedDate: str
    forecastGeneratedAt: str
    forecastStartDate: str
    forecastEndDate: str
    forecastHorizonDays: int
    currency: str
    unit: str
    lastObservedPricePerKg: float
    predictedWholesalePricePerKg: float
    estimatedFarmGatePricePerKg: float
    lowerBoundPerKg: float
    upperBoundPerKg: float
    predictedChangePercentage: float
    recommendation: str
    confidence: ConfidenceInfo
    costBreakdown: CostBreakdownResponse
    quantityAnalysis: QuantityAnalysisResponse | None = None
    model: ForecastModelInfo
    syntheticData: bool
    disclaimer: str
