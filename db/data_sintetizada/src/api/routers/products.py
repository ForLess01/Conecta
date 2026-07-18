from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from src.api.dependencies import get_product_service
from src.api.schemas.product import LatestObservationResponse, ProductListResponse
from src.api.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListResponse, summary="List available products")
def list_products(product_service: ProductService = Depends(get_product_service)) -> ProductListResponse:
    items = product_service.list_products()
    return ProductListResponse(items=items, total=len(items))


@router.get("/{product}/latest", response_model=LatestObservationResponse, summary="Get latest observation")
def latest_product_observation(
    product: str,
    variety: str | None = Query(default=None),
    originDepartment: str | None = Query(default=None),
    originProvince: str | None = Query(default=None),
    market: str | None = Query(default=None),
    product_service: ProductService = Depends(get_product_service),
) -> LatestObservationResponse:
    payload = product_service.get_latest_observation(
        product=product,
        variety=variety,
        origin_department=originDepartment,
        origin_province=originProvince,
        market=market,
    )
    return LatestObservationResponse(**payload)
