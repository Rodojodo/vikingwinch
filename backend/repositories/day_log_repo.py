from datetime import date, datetime, time, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.day_log import Day_Log


async def get_day_log_from_date(db: AsyncSession, winch_id: int, day: date):
    start_of_day = datetime.combine(day, time.min)
    start_of_next_day = start_of_day + timedelta(days=1)

    stmt = select(Day_Log).where(
        Day_Log.timestamp >= start_of_day,
        Day_Log.timestamp < start_of_next_day,
        Day_Log.winch_id == winch_id,
    )
    result = await db.execute(stmt)
    day_log = result.scalars().all()
    return day_log


async def get_drum_values(db: AsyncSession, winch_id: int):
    stmt = (select(Day_Log.left_drum, Day_Log.right_drum)
            .where(Day_Log.winch_id == winch_id)
            .order_by(Day_Log.timestamp.desc())
            .limit(1)
            )
    result = await db.execute(stmt)
    log = result.first()
    return log

