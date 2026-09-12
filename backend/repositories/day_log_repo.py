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


async def get_winch_hours(db: AsyncSession, winch_id: int):
    stmt = (select(Day_Log.hours)
            .where(Day_Log.winch_id == winch_id, Day_Log.hours.isnot(None))
            .order_by(Day_Log.timestamp.desc())
            .limit(1)
            )
    result = await db.execute(stmt)
    return result.scalars().first()

async def add_day_log(db: AsyncSession, winch_id: int, payload):
    from datetime import timezone
    new_log = Day_Log(
        squadron_id=payload.squadron_id,
        winch_id=winch_id,
        type=payload.type,
        timestamp=datetime.now(timezone.utc),
        operator_sn=payload.operator_sn,
        trainee=payload.trainee,
        cable_check=payload.cable_check,
        hours=payload.hours
    )
    db.add(new_log)
    await db.flush()
    return new_log
