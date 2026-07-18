from __future__ import annotations

import threading
from pathlib import Path

import pandas as pd


class FeatureRepository:
    def __init__(self, dataset_path: Path) -> None:
        self._dataset_path = dataset_path
        self._lock = threading.RLock()
        self._dataset: pd.DataFrame | None = None

    def get_dataset(self) -> pd.DataFrame:
        with self._lock:
            if self._dataset is None:
                dataset = pd.read_csv(self._dataset_path, parse_dates=["date"])
                dataset["product_key"] = dataset["product"].astype(str) + "|" + dataset["variety"].astype(str)
                self._dataset = dataset
            return self._dataset.copy()

    def latest_row_for_filters(
        self,
        *,
        product: str,
        variety: str | None = None,
        origin_department: str | None = None,
        origin_province: str | None = None,
        market: str | None = None,
        destination_city: str | None = None,
        allowed_keys: set[str] | None = None,
    ) -> pd.Series | None:
        df = self.get_dataset()
        mask = df["product"].astype(str).str.casefold() == product.casefold()
        if variety:
            mask &= df["variety"].astype(str).str.casefold() == variety.casefold()
        if origin_department:
            mask &= df["origin_department"].astype(str).str.casefold() == origin_department.casefold()
        if origin_province:
            mask &= df["origin_province"].astype(str).str.casefold() == origin_province.casefold()
        if market:
            mask &= df["market"].astype(str).str.casefold() == market.casefold()
        if destination_city:
            mask &= df["market_city"].astype(str).str.casefold() == destination_city.casefold()
        if allowed_keys is not None:
            mask &= df["product_key"].isin(allowed_keys)
        filtered = df.loc[mask].sort_values("date")
        if filtered.empty:
            return None
        return filtered.iloc[-1].copy()

    def latest_rows_for_keys(self, allowed_keys: set[str]) -> pd.DataFrame:
        df = self.get_dataset()
        filtered = df.loc[df["product_key"].isin(allowed_keys)].sort_values("date")
        return filtered.groupby("product_key", dropna=False).tail(1).copy().sort_values(["product", "variety"])
