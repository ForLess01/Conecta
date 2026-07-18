"""create model predictions table"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260718_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "model_predictions",
        sa.Column("prediction_id", sa.String(length=36), primary_key=True),
        sa.Column("product", sa.String(length=100), nullable=False),
        sa.Column("variety", sa.String(length=100), nullable=False),
        sa.Column("origin_department", sa.String(length=100), nullable=False),
        sa.Column("origin_province", sa.String(length=100), nullable=False),
        sa.Column("destination_market", sa.String(length=200), nullable=False),
        sa.Column("destination_city", sa.String(length=100), nullable=False),
        sa.Column("last_observed_date", sa.Date(), nullable=False),
        sa.Column("forecast_generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("forecast_start_date", sa.Date(), nullable=False),
        sa.Column("forecast_end_date", sa.Date(), nullable=False),
        sa.Column("forecast_horizon_days", sa.Integer(), nullable=False),
        sa.Column("last_observed_price_per_kg", sa.Numeric(12, 4), nullable=True),
        sa.Column("predicted_wholesale_price_per_kg", sa.Numeric(12, 4), nullable=False),
        sa.Column("estimated_farm_gate_price_per_kg", sa.Numeric(12, 4), nullable=True),
        sa.Column("lower_bound_per_kg", sa.Numeric(12, 4), nullable=True),
        sa.Column("upper_bound_per_kg", sa.Numeric(12, 4), nullable=True),
        sa.Column("predicted_change_percentage", sa.Numeric(12, 4), nullable=True),
        sa.Column("recommendation", sa.String(length=30), nullable=True),
        sa.Column("confidence_label", sa.String(length=20), nullable=True),
        sa.Column("quantity_kg", sa.Numeric(14, 2), nullable=True),
        sa.Column("estimated_wholesale_revenue", sa.Numeric(14, 2), nullable=True),
        sa.Column("estimated_farm_gate_revenue", sa.Numeric(14, 2), nullable=True),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("model_strategy", sa.String(length=30), nullable=True),
        sa.Column("model_version", sa.String(length=30), nullable=True),
        sa.Column("synthetic_data", sa.Boolean(), nullable=False),
        sa.Column("request_payload", postgresql.JSONB(astext_type=sa.Text()) if op.get_bind().dialect.name == "postgresql" else sa.JSON(), nullable=True),
        sa.Column("response_payload", postgresql.JSONB(astext_type=sa.Text()) if op.get_bind().dialect.name == "postgresql" else sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("model_predictions")
