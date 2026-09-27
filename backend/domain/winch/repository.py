from datetime import date, datetime, time, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from domain.day_log.model import Day_Log
from domain.winch.model import Winch
from domain.squadron.repository import squadron_exists


async def get_winch_from_id(db: AsyncSession, id: str):
    stmt = select(Winch).where(Winch.id == id)
    result = await db.execute(stmt)
    winch = result.scalar_one_or_none()
    if winch is None:
        raise ValueError("Winch not found")
    return winch


async def get_winches_from_sqn(db: AsyncSession, squadron: str):
    valid_squadron = await squadron_exists(db, squadron)
    if valid_squadron is False:
        raise ValueError("Squadron not found")
    stmt = select(Winch).where(Winch.squadron_id == squadron)
    result = await db.execute(stmt)
    winchs = result.scalars().all()
    if len(winchs) == 0:
        raise ValueError("Winches not found")
    return winchs


async def get_winch_statuses_from_sqn(db: AsyncSession, squadron: str, day: date):
    winches = await get_winches_from_sqn(db, squadron)
    start_of_day = datetime.combine(day, time.min)
    start_of_next_day = start_of_day + timedelta(days=1)
    stmt = select(Day_Log).where(
        Day_Log.squadron_id == squadron,
        Day_Log.timestamp >= start_of_day,
        Day_Log.timestamp < start_of_next_day,
    )
    result = await db.execute(stmt)
    logs_by_winch: dict[int, list[Day_Log]] = {}
    for log in result.scalars().all():
        logs_by_winch.setdefault(log.winch_id, []).append(log)

    statuses = []
    for winch in winches:
        log_types = {log.type for log in logs_by_winch.get(winch.id, [])}
        if "finish_day" in log_types:
            status = "day_finished"
        elif "sign_on" in log_types:
            status = "in_use"
        elif "di" in log_types:
            status = "di_complete"
        else:
            status = "default"
        statuses.append({
            "id": winch.id,
            "registration": winch.registration,
            "squadron_id": winch.squadron_id,
            "status": status,
        })
    return statuses
