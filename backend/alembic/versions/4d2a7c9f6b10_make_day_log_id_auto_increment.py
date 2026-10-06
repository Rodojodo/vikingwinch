"""Make day-log IDs auto-incrementing.

Revision ID: 4d2a7c9f6b10
Revises: e9639d95ead0
"""

from typing import Sequence, Union

from alembic import op


revision: str = "4d2a7c9f6b10"
down_revision: Union[str, None] = "e9639d95ead0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE day_log "
        "MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE day_log "
        "MODIFY COLUMN id INT NOT NULL"
    )
