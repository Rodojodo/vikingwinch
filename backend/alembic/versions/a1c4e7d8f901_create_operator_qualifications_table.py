"""Create operator_qualifications table.

Revision ID: a1c4e7d8f901
Revises: 4d2a7c9f6b10
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "a1c4e7d8f901"
down_revision: Union[str, None] = "4d2a7c9f6b10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "operator_qualifications",
        sa.Column("service_no", sa.String(length=20), nullable=False),
        sa.Column("stars_resource_id", sa.String(length=50), nullable=True),
        sa.Column("c005_operator", sa.String(length=10), server_default="nil", nullable=False),
        sa.Column("e004_instructor", sa.String(length=10), server_default="nil", nullable=False),
        sa.Column("c003_examiner", sa.String(length=10), server_default="nil", nullable=False),
        sa.Column("rolling_currency", sa.String(length=10), server_default="nil", nullable=False),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["service_no"], ["operators.service_no"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("service_no"),
    )


def downgrade() -> None:
    op.drop_table("operator_qualifications")
