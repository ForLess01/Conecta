from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from .schemas import QualityReport


def iso_now() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def create_report() -> QualityReport:
    return QualityReport(startedAt=iso_now())


def finalize_report(report: QualityReport, status: str) -> QualityReport:
    report.finishedAt = iso_now()
    report.status = status  # type: ignore[assignment]
    return report


def write_report(report: QualityReport, path: Path) -> None:
    path.write_text(report.model_dump_json(indent=2), encoding="utf-8")
