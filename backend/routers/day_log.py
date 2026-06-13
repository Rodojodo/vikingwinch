from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from repositories import day_log_repo
from core.schemas import DayLogRead, DrumValuesRead

router = APIRouter(prefix="/winch/{winch_id}", tags=["day-log"])


@router.get("/day_log", response_model=list[DayLogRead])
async def get_day_log(
    winch_id: int,
    day: date,
    db: AsyncSession = Depends(get_db),
):
    """All day-log entries for a winch on a given date (?day=YYYY-MM-DD)."""
    return await day_log_repo.get_day_log_from_date(db, winch_id, day)


@router.get("/drums", response_model=DrumValuesRead)
async def get_drum_values(
    winch_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Most recent left/right drum cable counts for a winch."""
    row = await day_log_repo.get_drum_values(db, winch_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No day-log entries for this winch",
        )
    return DrumValuesRead(left_drum=row.left_drum, right_drum=row.right_drum)