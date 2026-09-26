"""Migrate cable checks from day_log columns to records.

Revision ID: 7c2f4a9d1b6e
Revises: b4f1c2a7d310
Create Date: 2026-09-26 19:00:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7c2f4a9d1b6e"
down_revision: Union[str, None] = "b4f1c2a7d310"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


OLD_DAY_LOG_TYPE = sa.Enum("finish_day", "di", "sign_on", name="type")
NEW_DAY_LOG_TYPE = sa.Enum("finish_day", "di", "sign_on", "cable_check", name="type")


def upgrade() -> None:
    day_log = sa.table(
        "day_log",
        sa.column("id", sa.Integer),
        sa.column("squadron_id", sa.String(50)),
        sa.column("winch_id", sa.Integer),
        sa.column("type", sa.String(20)),
        sa.column("timestamp", sa.DateTime),
        sa.column("operator_sn", sa.String(20)),
        sa.column("trainee", sa.String(20)),
        sa.column("cable_check", sa.String(20)),
        sa.column("hours", sa.Float),
    )

    op.alter_column(
        "day_log",
        "type",
        existing_type=OLD_DAY_LOG_TYPE,
        type_=NEW_DAY_LOG_TYPE,
        existing_nullable=False,
    )

    connection = op.get_bind()
    legacy_checks = connection.execute(
        sa.select(
            day_log.c.squadron_id,
            day_log.c.winch_id,
            day_log.c.timestamp,
            day_log.c.cable_check,
        ).where(day_log.c.cable_check.is_not(None))
    ).mappings()

    for check in legacy_checks:
        connection.execute(
            day_log.insert().values(
                squadron_id=check["squadron_id"],
                winch_id=check["winch_id"],
                type="cable_check",
                timestamp=check["timestamp"],
                operator_sn=check["cable_check"],
                trainee=None,
                cable_check=None,
                hours=None,
            )
        )

    op.drop_column("day_log", "cable_check")


def downgrade() -> None:
    day_log = sa.table(
        "day_log",
        sa.column("id", sa.Integer),
        sa.column("squadron_id", sa.String(50)),
        sa.column("winch_id", sa.Integer),
        sa.column("type", sa.String(20)),
        sa.column("timestamp", sa.DateTime),
        sa.column("operator_sn", sa.String(20)),
        sa.column("cable_check", sa.String(20)),
    )

    op.add_column("day_log", sa.Column("cable_check", sa.String(20), nullable=True))

    connection = op.get_bind()
    cable_checks = connection.execute(
        sa.select(
            day_log.c.id,
            day_log.c.winch_id,
            day_log.c.timestamp,
            day_log.c.operator_sn,
        ).where(day_log.c.type == "cable_check")
    ).mappings().all()

    existing_logs = connection.execute(
        sa.select(
            day_log.c.id,
            day_log.c.winch_id,
            day_log.c.timestamp,
            day_log.c.type,
        ).where(day_log.c.type != "cable_check")
    ).mappings().all()

    for check in cable_checks:
        candidates = [
            log
            for log in existing_logs
            if log["winch_id"] == check["winch_id"]
            and _same_timestamp(log["timestamp"], check["timestamp"])
        ]
        if len(candidates) != 1:
            raise RuntimeError(
                "Cannot safely downgrade cable_check record "
                f"{check['id']}: expected exactly one matching parent log, "
                f"found {len(candidates)}"
            )

        connection.execute(
            day_log.update()
            .where(day_log.c.id == candidates[0]["id"])
            .values(cable_check=check["operator_sn"])
        )

    connection.execute(day_log.delete().where(day_log.c.type == "cable_check"))

    op.alter_column(
        "day_log",
        "type",
        existing_type=NEW_DAY_LOG_TYPE,
        type_=OLD_DAY_LOG_TYPE,
        existing_nullable=False,
    )


def _same_timestamp(left: datetime | None, right: datetime | None) -> bool:
    return left == right
