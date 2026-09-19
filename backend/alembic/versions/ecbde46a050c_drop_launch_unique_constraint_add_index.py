"""drop launch unique constraint add index

Revision ID: ecbde46a050c
Revises: b4f1c2a7d310
Create Date: 2026-09-19 12:12:04.513390

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'ecbde46a050c'
down_revision: Union[str, None] = 'b4f1c2a7d310'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the new index covering winch_id first so MySQL InnoDB foreign key constraint on winch_id is preserved
    op.create_index('ix_launches_winch_drum_launch_id', 'launches', ['winch_id', 'drum', 'launch_id'], unique=False)
    op.drop_constraint('uix_winch_drum_launch_number', 'launches', type_='unique')


def downgrade() -> None:
    # Recreate the unique constraint covering winch_id first before dropping the non-unique index
    op.create_unique_constraint('uix_winch_drum_launch_number', 'launches', ['winch_id', 'drum', 'launch_number'])
    op.drop_index('ix_launches_winch_drum_launch_id', table_name='launches')
