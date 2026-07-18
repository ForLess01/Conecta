from __future__ import annotations

from contextlib import contextmanager
from datetime import date, datetime
from decimal import Decimal
from typing import Generator

from sqlalchemy import Boolean, Date, DateTime, Integer, JSON, Numeric, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from .settings import get_settings


class Base(DeclarativeBase):
    pass


class ModelPredictionRecord(Base):
    __tablename__ = "model_predictions"

    prediction_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    product: Mapped[str] = mapped_column(String(100), nullable=False)
    variety: Mapped[str] = mapped_column(String(100), nullable=False)
    origin_department: Mapped[str] = mapped_column(String(100), nullable=False)
    origin_province: Mapped[str] = mapped_column(String(100), nullable=False)
    destination_market: Mapped[str] = mapped_column(String(200), nullable=False)
    destination_city: Mapped[str] = mapped_column(String(100), nullable=False)
    last_observed_date: Mapped[date] = mapped_column(Date, nullable=False)
    forecast_generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    forecast_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    forecast_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    forecast_horizon_days: Mapped[int] = mapped_column(Integer, nullable=False)
    last_observed_price_per_kg: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    predicted_wholesale_price_per_kg: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    estimated_farm_gate_price_per_kg: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    lower_bound_per_kg: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    upper_bound_per_kg: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    predicted_change_percentage: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    recommendation: Mapped[str | None] = mapped_column(String(30), nullable=True)
    confidence_label: Mapped[str | None] = mapped_column(String(20), nullable=True)
    quantity_kg: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    estimated_wholesale_revenue: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    estimated_farm_gate_revenue: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model_strategy: Mapped[str | None] = mapped_column(String(30), nullable=True)
    model_version: Mapped[str | None] = mapped_column(String(30), nullable=True)
    synthetic_data: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    request_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    response_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)


_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
        _engine = create_engine(settings.database_url, future=True, pool_pre_ping=True, connect_args=connect_args)
    return _engine


def get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, expire_on_commit=False, class_=Session)
    return _SessionLocal


def get_db_session() -> Generator[Session, None, None]:
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    session = get_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
