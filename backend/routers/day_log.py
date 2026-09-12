from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from repositories import day_log_repo
from core.schemas import DayLogRead, WinchHoursRead, DayLogCreate

router = APIRouter(prefix="/winch/{winch_id}", tags=["day-log"])


@router.post("/day_log", response_model=DayLogRead, status_code=status.HTTP_201_CREATED)
async def create_day_log(
    winch_id: int,
    payload: DayLogCreate,
    db: AsyncSession = Depends(get_db),
):
    log = await day_log_repo.add_day_log(db, winch_id, payload)
    await db.commit()
    return log


@router.get("/day_log", response_model=list[DayLogRead])
async def get_day_log(
    winch_id: int,
    day: date,
    db: AsyncSession = Depends(get_db),
):
    """All day-log entries for a winch on a given date (?day=YYYY-MM-DD)."""
    return await day_log_repo.get_day_log_from_date(db, winch_id, day)


@router.get("/hours", response_model=WinchHoursRead)
async def get_winch_hours(
    winch_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Most recent hours reading for a winch."""
    hours = await day_log_repo.get_winch_hours(db, winch_id)
    if hours is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No day-log entries for this winch",
        )
    return WinchHoursRead(hours=hours)