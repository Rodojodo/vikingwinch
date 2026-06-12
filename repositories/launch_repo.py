from datetime import datetime, timezone, date, time, timedelta

from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.launch import Launch


async def add_launch(db_session: AsyncSession, squadron_id: str, winch_id: int, operator_id: str, drum: Literal['left', 'right']):
    new_launch = Launch(
        squadron_id = squadron_id,
        winch_id = winch_id,
        drum = drum,
        timestamp = datetime.now(timezone.utc),
        operator_id = operator_id,
        remarks = None
    )

    db_session.add(new_launch)
    await db_session.flush()

    return new_launch


async def add_remark_to_launch(db_session: AsyncSession, winch_id: int, drum: Literal['left', 'right'], remark: str):
    stmt = (select(Launch)
            .where(Launch.winch_id == winch_id, Launch.drum == drum)
            .order_by(Launch.timestamp.desc())
            .limit(1)
            )
    result = await db_session.execute(stmt)
    launch = result.scalars().first()

    if launch is None:
        raise ValueError("No previous launch")

    if launch.remarks is None:
        launch.remarks = remark
    else:
        launch.remarks = launch.remarks + ", " + remark

    await db_session.commit()
    return launch


async def add_repair_to_launch(db_session: AsyncSession, winch_id: int, drum: Literal['left', 'right'], repair: str, supervisor_id: str):
    stmt = (select(Launch)
            .where(Launch.winch_id == winch_id, Launch.drum == drum)
            .order_by(Launch.timestamp.desc())
            .limit(1)
            )
    result = await db_session.execute(stmt)
    launch = result.scalars().first()

    if launch is None:
        raise ValueError("No previous launch")

    if launch.remarks is None:
        launch.remarks = "Repair: " + repair + " S_id: " + supervisor_id
    else:
        launch.remarks = launch.remarks + ", " + "Repair: " + repair + " S_id: " + supervisor_id

    await db_session.commit()
    return launch


async def get_launches_from_date(db: AsyncSession, winch_id: int, day: date):
    start_of_day = datetime.combine(day, time.min)
    start_of_next_day = start_of_day + timedelta(days=1)

    stmt = select(Launch).where(
        Launch.timestamp >= start_of_day,
        Launch.timestamp < start_of_next_day,
        Launch.winch_id == winch_id,
    )
    result = await db.execute(stmt)
    day_log = result.scalars().all()
    return day_log