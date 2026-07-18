from __future__ import annotations

from pydantic import BaseModel


class PredictionListResponse(BaseModel):
    items: list[dict]
    page: int
    pageSize: int
    total: int
    totalPages: int
