from __future__ import annotations

import pandas as pd

from .feature_repository import FeatureRepository


class ProductRepository:
    def __init__(self, feature_repository: FeatureRepository) -> None:
        self._feature_repository = feature_repository

    def list_available_products(self, allowed_keys: set[str]) -> pd.DataFrame:
        return self._feature_repository.latest_rows_for_keys(allowed_keys)
