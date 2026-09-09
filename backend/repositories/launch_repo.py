from datetime import datetime, timezone, date, time, timedelta

from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.launch import Launch


async def add_launch(db_session: AsyncSession, squadron_id: str, winch_id: int, operator_sn: str, drum: Literal['left', 'right'], is_burn: bool = False):
    from sqlalchemy.exc import IntegrityError
    import asyncio
    
    launch_num = None
    if not is_burn:
        for attempt in range(3):
            stmt = (select(Launch.launch_number)
                    .where(Launch.winch_id == winch_id, Launch.drum == drum, Launch.launch_number.isnot(None))
                    .order_by(Launch.launch_number.desc())
                    .limit(1))
            result = await db_session.execute(stmt)
            last_num = result.scalars().first()
            launch_num = 1 if last_num is None else last_num + 1
            
            new_launch = Launch(
                squadron_id = squadron_id,
                winch_id = winch_id,
                drum = drum,
                launch_number = launch_num,
                timestamp = datetime.now(timezone.utc),
                operator_sn = operator_sn,
                remarks = None
            )
            db_session.add(new_launch)
            try:
                async with db_session.begin_nested():
                    await db_session.flush()
                break
            except IntegrityError:
                db_session.expunge(new_launch)
                if attempt == 2:
                    raise
                await asyncio.sleep(0.1)
    else:
        new_launch = Launch(
            squadron_id = squadron_id,
            winch_id = winch_id,
            drum = drum,
            launch_number = None,
            timestamp = datetime.now(timezone.utc),
            operator_sn = operator_sn,
            remarks = None
        )
        db_session.add(new_launch)
        await db_session.flush()

    return new_launch


async def delete_launch(db_session: AsyncSession, launch_id: int):
    stmt = select(Launch).where(Launch.launch_id == launch_id)
    result = await db_session.execute(stmt)
    launch = result.scalars().first()
    if launch is not None:
        await db_session.delete(launch)
        await db_session.flush()
    return launch


async def add_remark_to_launch(db_session: AsyncSession, launch_id: int, remark: str):
    stmt = select(Launch).where(Launch.launch_id == launch_id)
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


async def add_repair_to_launch(db_session: AsyncSession, launch_id: int, repair: str, supervisor_id: str):
    stmt = select(Launch).where(Launch.launch_id == launch_id)
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

async def get_brought_forward(db: AsyncSession, winch_id: int, current_day: date):
    start_of_day = datetime.combine(current_day, time.min)
    
    stmt_left = (select(Launch.launch_number)
                 .where(Launch.winch_id == winch_id, Launch.drum == 'left', Launch.launch_number.isnot(None), Launch.timestamp < start_of_day)
                 .order_by(Launch.timestamp.desc())
                 .limit(1))
    result_left = await db.execute(stmt_left)
    left_bf = result_left.scalars().first()

    stmt_right = (select(Launch.launch_number)
                  .where(Launch.winch_id == winch_id, Launch.drum == 'right', Launch.launch_number.isnot(None), Launch.timestamp < start_of_day)
                  .order_by(Launch.timestamp.desc())
                  .limit(1))
    result_right = await db.execute(stmt_right)
    right_bf = result_right.scalars().first()

    return {"left": left_bf, "right": right_bf}