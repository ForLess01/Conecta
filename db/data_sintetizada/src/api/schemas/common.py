from __future__ import annotations

from pydantic import BaseModel, Field


class MessageField(BaseModel):
    code: str = Field(examples=["MODEL_NOT_FOUND"])
    message: str = Field(examples=["No existe un modelo disponible para el producto solicitado."])
    details: dict = Field(default_factory=dict)


class ErrorEnvelope(BaseModel):
    error: MessageField


class OriginInfo(BaseModel):
    department: str
    province: str


class DestinationInfo(BaseModel):
    market: str
    city: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    modelsLoaded: bool
