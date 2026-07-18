from __future__ import annotations

import json
import threading
from dataclasses import dataclass
from pathlib import Path

import joblib

from src.modeling.artifact_manager import slugify_product

from .logging import get_logger


logger = get_logger(__name__)


@dataclass(frozen=True)
class ModelBundle:
    cache_key: str
    strategy: str
    model_name: str
    model_version: str
    estimator: object
    metadata: dict
    feature_columns: list[str]
    margin: float
    artifact_dir: Path


class ModelCache:
    def __init__(self, models_root: Path, enabled: bool = True) -> None:
        self._models_root = models_root
        self._enabled = enabled
        self._lock = threading.RLock()
        self._cache: dict[str, ModelBundle] = {}

    def get_or_load(self, *, product: str, variety: str, strategy: str, model_version: str) -> ModelBundle:
        artifact_dir = self._resolve_artifact_dir(product=product, variety=variety, strategy=strategy)
        try:
            relative_artifact_dir = artifact_dir.relative_to(self._models_root.parent).as_posix()
        except ValueError:
            relative_artifact_dir = artifact_dir.as_posix()
        cache_key = f'{strategy}:{relative_artifact_dir}'
        with self._lock:
            if self._enabled and cache_key in self._cache:
                return self._cache[cache_key]
            metadata = json.loads((artifact_dir / 'metadata.json').read_text(encoding='utf-8'))
            feature_columns = json.loads((artifact_dir / 'feature_columns.json').read_text(encoding='utf-8'))
            margin = float(json.loads((artifact_dir / 'residuals.json').read_text(encoding='utf-8'))['margin'])
            estimator = joblib.load(artifact_dir / 'model.joblib')
            bundle = ModelBundle(
                cache_key=cache_key,
                strategy=strategy,
                model_name=str(metadata.get('modelName', 'unknown')),
                model_version=model_version,
                estimator=estimator,
                metadata=metadata,
                feature_columns=list(feature_columns),
                margin=margin,
                artifact_dir=artifact_dir,
            )
            if self._enabled:
                self._cache[cache_key] = bundle
            logger.info('Loaded model bundle %s from %s', cache_key, artifact_dir)
            return bundle

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

    def loaded_models(self) -> list[str]:
        with self._lock:
            return sorted(self._cache.keys())

    def _resolve_artifact_dir(self, *, product: str, variety: str, strategy: str) -> Path:
        if strategy == 'global':
            return self._models_root / 'global'
        return self._models_root / 'by_product' / slugify_product(product, variety)
