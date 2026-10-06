from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import Principal, authorize_operator, authorize_winch, get_current_principal
from database.session import get_db
from domain.day_log import repository as day_log_repo
from domain.day_log.schema import DayLogRead, WinchHoursResponse, DayLogCreate

router = APIRouter(prefix="/winch/{winch_id}", tags=["day-log"], dependencies=[Depends(get_current_principal)])


@router.post("/day_log", response_model=DayLogRead, status_code=status.HTTP_201_CREATED)
async def create_day_log(
    winch_id: int,
    payload: DayLogCreate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    try:
        winch = await authorize_winch(db, principal, winch_id)
        operator = await authorize_operator(db, principal, payload.operator_sn)
        if payload.squadron_id != winch.squadron_id or operator.squadron_id != winch.squadron_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Day-log squadron and operator must match the authorized winch",
            )
        log = await day_log_repo.add_day_log(db, winch_id, payload)
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return log


@router.get("/day_log", response_model=list[DayLogRead])
async def get_day_log(
    winch_id: int,
    day: date,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    await authorize_winch(db, principal, winch_id)
    """All day-log entries for a winch on a given date (?day=YYYY-MM-DD)."""
    return await day_log_repo.get_day_log_from_date(db, winch_id, day)


@router.get("/hours", response_model=WinchHoursResponse)
async def get_winch_hours(
    winch_id: int,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    await authorize_winch(db, principal, winch_id)
    """Most recent hours reading for a winch."""
    hours = await day_log_repo.get_winch_hours(db, winch_id)
    if hours is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No day-log entries for this winch",
        )
    return WinchHoursResponse(hours=hours)