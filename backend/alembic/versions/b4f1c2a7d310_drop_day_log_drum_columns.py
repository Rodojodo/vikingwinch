"""Drop redundant launch columns from day_log

Launch totals are derived from the launches table, so day_log no longer
stores left_drum / right_drum.

Revision ID: b4f1c2a7d310
Revises: e9639d95ead0
Create Date: 2026-09-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4f1c2a7d310'
down_revision: Union[str, None] = 'e9639d95ead0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('day_log', 'left_drum')
    op.drop_column('day_log', 'right_drum')


def downgrade() -> None:
    op.add_column('day_log', sa.Column('right_drum', sa.Integer(), nullable=True))
    op.add_column('day_log', sa.Column('left_drum', sa.Integer(), nullable=True))
