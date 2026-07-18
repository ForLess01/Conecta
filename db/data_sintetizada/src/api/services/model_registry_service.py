from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from src.api.exception_handlers import ApiError


class ModelRegistryService:
    def __init__(self, registry_path: Path, models_root: Path) -> None:
        self._registry_path = registry_path
        self._models_root = models_root

    def load_registry(self) -> dict[str, Any]:
        if not self._registry_path.exists():
            raise ApiError(
                code='MODEL_NOT_FOUND',
                message='The model registry is not available.',
                status_code=503,
            )
        return json.loads(self._registry_path.read_text(encoding='utf-8'))

    def allowed_product_keys(self) -> set[str]:
        return set(self.load_registry().get('products', {}).keys())

    def get_registry_entry(self, product: str, variety: str) -> dict[str, Any]:
        key = f'{product}|{variety}'
        registry = self.load_registry()
        entry = registry.get('products', {}).get(key)
        if entry is None:
            raise ApiError(
                code='MODEL_NOT_FOUND',
                message='No model is available for the requested product.',
                status_code=404,
                details={'product': product, 'variety': variety},
            )
        return {'key': key, 'modelVersion': registry.get('modelVersion', '1.0.0'), **entry}

    def get_model_metadata(self, product: str, variety: str) -> dict[str, Any]:
        entry = self.get_registry_entry(product, variety)
        artifact_path = Path(entry['artifactPath'])
        if artifact_path.parts and artifact_path.parts[0] == 'models':
            artifact_path = Path(*artifact_path.parts[1:])
        metadata_path = self._models_root / artifact_path.parent / 'metadata.json'
        metadata = json.loads(metadata_path.read_text(encoding='utf-8'))
        return {**entry, **metadata}

    def list_model_items(self) -> list[dict[str, Any]]:
        registry = self.load_registry()
        items: list[dict[str, Any]] = []
        for key in sorted(registry.get('products', {}).keys()):
            product, variety = key.split('|', 1)
            metadata = self.get_model_metadata(product, variety)
            metrics = metadata.get('metrics', {})
            items.append(
                {
                    'product': product,
                    'variety': variety,
                    'strategy': metadata.get('strategy', 'global'),
                    'modelName': metadata.get('modelName', 'unknown'),
                    'mae': float(metrics.get('test_MAE', 0.0)),
                    'rmse': float(metrics.get('test_RMSE', 0.0)),
                    'mape': float(metrics.get('test_MAPE', 0.0)),
                    'modelAvailable': True,
                }
            )
        return items
