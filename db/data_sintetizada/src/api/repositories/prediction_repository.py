from __future__ import annotations

import math
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from src.api.infrastructure.database import ModelPredictionRecord


class PredictionRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, record: ModelPredictionRecord) -> ModelPredictionRecord:
        self._session.add(record)
        self._session.commit()
        self._session.refresh(record)
        return record

    def get_by_id(self, prediction_id: str) -> ModelPredictionRecord | None:
        return self._session.get(ModelPredictionRecord, prediction_id)

    def list_paginated(
        self,
        *,
        product: str | None,
        variety: str | None,
        recommendation: str | None,
        date_from,
        date_to,
        page: int,
        page_size: int,
    ) -> dict[str, Any]:
        query: Select[tuple[ModelPredictionRecord]] = select(ModelPredictionRecord)
        count_query = select(func.count()).select_from(ModelPredictionRecord)

        if product:
            query = query.where(ModelPredictionRecord.product.ilike(product))
            count_query = count_query.where(ModelPredictionRecord.product.ilike(product))
        if variety:
            query = query.where(ModelPredictionRecord.variety.ilike(variety))
            count_query = count_query.where(ModelPredictionRecord.variety.ilike(variety))
        if recommendation:
            query = query.where(ModelPredictionRecord.recommendation.ilike(recommendation))
            count_query = count_query.where(ModelPredictionRecord.recommendation.ilike(recommendation))
        if date_from:
            query = query.where(ModelPredictionRecord.forecast_generated_at >= date_from)
            count_query = count_query.where(ModelPredictionRecord.forecast_generated_at >= date_from)
        if date_to:
            query = query.where(ModelPredictionRecord.forecast_generated_at <= date_to)
            count_query = count_query.where(ModelPredictionRecord.forecast_generated_at <= date_to)

        total = int(self._session.execute(count_query).scalar_one())
        items = self._session.execute(
            query.order_by(ModelPredictionRecord.forecast_generated_at.desc()).offset((page - 1) * page_size).limit(page_size)
        ).scalars().all()
        total_pages = math.ceil(total / page_size) if total else 0
        return {"items": items, "page": page, "page_size": page_size, "total": total, "total_pages": total_pages}
