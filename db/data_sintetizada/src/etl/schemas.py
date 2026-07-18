from __future__ import annotations

from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class RejectedRow(BaseModel):
    source_file: str
    stage: str
    reason: str
    row_data: dict


class QualityReport(BaseModel):
    executionId: str = Field(default_factory=lambda: str(uuid4()))
    startedAt: str
    finishedAt: str | None = None
    status: Literal["RUNNING", "SUCCESS", "FAILED"] = "RUNNING"
    inputFiles: dict[str, str] = Field(default_factory=dict)
    rowsRead: dict[str, int] = Field(default_factory=dict)
    duplicatesRemoved: dict[str, int] = Field(default_factory=dict)
    invalidRows: dict[str, int] = Field(default_factory=dict)
    nullValuesBefore: dict[str, dict[str, int]] = Field(default_factory=dict)
    nullValuesAfter: dict[str, dict[str, int]] = Field(default_factory=dict)
    outliersDetected: dict[str, int] = Field(default_factory=dict)
    outliersRemoved: dict[str, int] = Field(default_factory=dict)
    imputedValues: dict[str, int] = Field(default_factory=dict)
    rowsMerged: int = 0
    trainingRows: int = 0
    inferenceRows: int = 0
    productSummary: dict[str, dict[str, int]] = Field(default_factory=dict)
    notes: list[str] = Field(default_factory=list)
