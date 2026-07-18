from __future__ import annotations

import uuid
from datetime import timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

import pandas as pd

from src.api.exception_handlers import ApiError
from src.api.infrastructure.database import ModelPredictionRecord
from src.api.infrastructure.model_cache import ModelCache
from src.api.infrastructure.settings import Settings
from src.modeling.prediction_intervals import apply_interval

from .feature_service import FeatureService
from .model_registry_service import ModelRegistryService
from .pricing_service import PricingService
from .recommendation_service import RecommendationService


class PredictionService:
    def __init__(
        self,
        *,
        settings: Settings,
        feature_service: FeatureService,
        model_registry_service: ModelRegistryService,
        recommendation_service: RecommendationService,
        pricing_service: PricingService,
        prediction_repository,
        model_cache: ModelCache,
    ) -> None:
        self._settings = settings
        self._feature_service = feature_service
        self._model_registry_service = model_registry_service
        self._recommendation_service = recommendation_service
        self._pricing_service = pricing_service
        self._prediction_repository = prediction_repository
        self._model_cache = model_cache

    def create_forecast(self, payload) -> dict:
        latest_row = self._feature_service.get_latest_features(
            product=payload.product,
            variety=payload.variety,
            origin_department=payload.originDepartment,
            origin_province=payload.originProvince,
            market=payload.destinationMarket,
            destination_city=payload.destinationCity,
        )
        registry_entry = self._model_registry_service.get_registry_entry(payload.product, payload.variety)
        bundle = self._model_cache.get_or_load(
            product=payload.product,
            variety=payload.variety,
            strategy=registry_entry["strategy"],
            model_version=registry_entry["modelVersion"],
        )
        missing_features = [column for column in bundle.feature_columns if column not in latest_row.index]
        if missing_features:
            raise ApiError(
                code="FEATURES_NOT_AVAILABLE",
                message="The inference dataset does not contain all required features.",
                status_code=503,
                details={"missingFeatures": missing_features},
            )
        feature_frame = pd.DataFrame([{column: latest_row[column] for column in bundle.feature_columns}])
        try:
            predicted_price = float(bundle.estimator.predict(feature_frame)[0])
        except Exception as exc:
            raise ApiError(code="PREDICTION_ERROR", message="The prediction could not be generated.", status_code=503, details={"type": exc.__class__.__name__}) from exc
        lower_bound_arr, upper_bound_arr = apply_interval(pd.Series([predicted_price]).to_numpy(), bundle.margin)
        lower_bound = float(lower_bound_arr[0])
        upper_bound = float(upper_bound_arr[0])
        recommendation, predicted_change = self._recommendation_service.build_recommendation(
            predicted_price=predicted_price,
            rolling_mean_7=float(latest_row["price_rolling_mean_7"]),
            rolling_std_7=float(latest_row["price_rolling_std_7"]),
        )
        estimated_farm_gate_price, cost_breakdown = self._pricing_service.calculate_farm_gate_price(
            predicted_wholesale_price_per_kg=predicted_price,
            logistics_cost_per_kg=float(latest_row["cost_per_kg"]),
        )
        confidence_level, confidence_label = self._recommendation_service.confidence_label(
            predicted_price=predicted_price,
            lower_bound=lower_bound,
            upper_bound=upper_bound,
        )
        forecast_generated_at = pd.Timestamp.now(tz=ZoneInfo("America/Bogota")).to_pydatetime()
        last_observed_date = latest_row["date"].date()
        forecast_start_date = last_observed_date + timedelta(days=1)
        forecast_end_date = last_observed_date + timedelta(days=payload.forecastDays)
        quantity_analysis = None
        if payload.quantityKg is not None:
            quantity_analysis = self._pricing_service.calculate_quantity_analysis(
                quantity_kg=float(payload.quantityKg),
                predicted_wholesale_price_per_kg=predicted_price,
                estimated_farm_gate_price_per_kg=estimated_farm_gate_price,
                lower_bound_per_kg=lower_bound,
                upper_bound_per_kg=upper_bound,
            )
        response = {
            "predictionId": str(uuid.uuid4()),
            "product": payload.product,
            "variety": payload.variety,
            "origin": {"department": payload.originDepartment, "province": payload.originProvince},
            "destination": {"market": payload.destinationMarket, "city": payload.destinationCity},
            "lastObservedDate": last_observed_date.isoformat(),
            "forecastGeneratedAt": forecast_generated_at.isoformat(),
            "forecastStartDate": forecast_start_date.isoformat(),
            "forecastEndDate": forecast_end_date.isoformat(),
            "forecastHorizonDays": payload.forecastDays,
            "currency": "PEN",
            "unit": "kg",
            "lastObservedPricePerKg": round(float(latest_row["avg_price_per_kg"]), 2),
            "predictedWholesalePricePerKg": round(predicted_price, 2),
            "estimatedFarmGatePricePerKg": round(estimated_farm_gate_price, 2),
            "lowerBoundPerKg": round(lower_bound, 2),
            "upperBoundPerKg": round(upper_bound, 2),
            "predictedChangePercentage": round(predicted_change * 100, 2),
            "recommendation": recommendation,
            "confidence": {"level": confidence_level, "label": confidence_label},
            "costBreakdown": {
                "logisticsCostPerKg": round(cost_breakdown.logistics_cost_per_kg, 2),
                "commissionCostPerKg": round(cost_breakdown.commission_cost_per_kg, 2),
                "handlingCostPerKg": round(cost_breakdown.handling_cost_per_kg, 2),
                "estimatedLossCostPerKg": round(cost_breakdown.estimated_loss_cost_per_kg, 2),
            },
            "quantityAnalysis": quantity_analysis,
            "model": {
                "name": bundle.model_name,
                "strategy": bundle.strategy,
                "version": bundle.model_version,
            },
            "syntheticData": True,
            "disclaimer": "Prediccion generada con datos sinteticos para desarrollo y demostracion. No representa una recomendacion comercial real.",
        }
        record = ModelPredictionRecord(
            prediction_id=response["predictionId"],
            product=payload.product,
            variety=payload.variety,
            origin_department=payload.originDepartment,
            origin_province=payload.originProvince,
            destination_market=payload.destinationMarket,
            destination_city=payload.destinationCity,
            last_observed_date=last_observed_date,
            forecast_generated_at=forecast_generated_at,
            forecast_start_date=forecast_start_date,
            forecast_end_date=forecast_end_date,
            forecast_horizon_days=payload.forecastDays,
            last_observed_price_per_kg=Decimal(str(response["lastObservedPricePerKg"])),
            predicted_wholesale_price_per_kg=Decimal(str(response["predictedWholesalePricePerKg"])),
            estimated_farm_gate_price_per_kg=Decimal(str(response["estimatedFarmGatePricePerKg"])),
            lower_bound_per_kg=Decimal(str(response["lowerBoundPerKg"])),
            upper_bound_per_kg=Decimal(str(response["upperBoundPerKg"])),
            predicted_change_percentage=Decimal(str(response["predictedChangePercentage"])),
            recommendation=response["recommendation"],
            confidence_label=response["confidence"]["label"],
            quantity_kg=Decimal(str(payload.quantityKg)) if payload.quantityKg is not None else None,
            estimated_wholesale_revenue=Decimal(str(quantity_analysis["estimatedWholesaleRevenue"])) if quantity_analysis else None,
            estimated_farm_gate_revenue=Decimal(str(quantity_analysis["estimatedFarmGateRevenue"])) if quantity_analysis else None,
            model_name=bundle.model_name,
            model_strategy=bundle.strategy,
            model_version=bundle.model_version,
            synthetic_data=True,
            request_payload=payload.model_dump(),
            response_payload=response,
        )
        try:
            self._prediction_repository.create(record)
        except Exception as exc:
            raise ApiError(code="DATABASE_ERROR", message="The prediction could not be saved.", status_code=500, details={"type": exc.__class__.__name__}) from exc
        return response

    def list_predictions(self, **filters):
        return self._prediction_repository.list_paginated(**filters)

    def get_prediction(self, prediction_id: str):
        record = self._prediction_repository.get_by_id(prediction_id)
        if record is None:
            raise ApiError(code="PREDICTION_ERROR", message="The requested prediction does not exist.", status_code=404)
        return record.response_payload
