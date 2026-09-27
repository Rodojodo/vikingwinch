from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from domain.winch import repository as winch_repo
from domain.day_log import repository as day_log_repo
from domain.launch import repository as launch_repo
from domain.operator import repository as operator_repo
from domain.winch.schema import (
    WinchRead,
    WinchStatusRead,
    BroughtForwardInfoResponse,
    WinchDayDataResponse,
    ExportDataResponse,
)

router = APIRouter(tags=["winches"])

@router.get("/winches/{winch_id}", response_model=WinchRead)
async def get_winch(
    winch_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await winch_repo.get_winch_from_id(db, winch_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/squadrons/{squadron_id}/winches", response_model=list[WinchRead])
async def get_winches_for_squadron(
    squadron_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await winch_repo.get_winches_from_sqn(db, squadron_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/squadrons/{squadron_id}/winch_status", response_model=list[WinchStatusRead])
async def get_winch_statuses_for_squadron(
    squadron_id: str,
    day: date,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await winch_repo.get_winch_statuses_from_sqn(db, squadron_id, day)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/winch/{winch_id}/bf_info", response_model=BroughtForwardInfoResponse)
async def get_bf_info(
    winch_id: int,
    day: date,
    db: AsyncSession = Depends(get_db),
):
    bf_data = await launch_repo.get_brought_forward(db, winch_id, day)
    engine_hours = await day_log_repo.get_winch_hours(db, winch_id)
    return BroughtForwardInfoResponse(
        left=bf_data.get("left"),
        right=bf_data.get("right"),
        hours=engine_hours
    )

@router.get("/winch/{winch_id}/day_data", response_model=WinchDayDataResponse)
async def get_winch_day_data(
    winch_id: int,
    day: date,
    db: AsyncSession = Depends(get_db),
):
    day_logs = await day_log_repo.get_day_log_from_date(db, winch_id, day)
    launches = await launch_repo.get_launches_from_date(db, winch_id, day)
    cable_check_verified = await day_log_repo.has_cable_check_for_day(db, winch_id, day)
    return WinchDayDataResponse(
        logs=day_logs,
        launches=launches,
        cable_check_verified=cable_check_verified,
    )

@router.get("/winch/{winch_id}/export_data", response_model=ExportDataResponse)
async def get_export_data(
    winch_id: int,
    squadron_id: str,
    day: date,
    db: AsyncSession = Depends(get_db),
):
    try:
        winch = await winch_repo.get_winch_from_id(db, winch_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        
    day_logs = await day_log_repo.get_day_log_from_date(db, winch_id, day)
    launches = await launch_repo.get_launches_from_date(db, winch_id, day)
    
    try:
        operators = await operator_repo.get_operators_from_sqn(db, squadron_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

        
    bf_data = await launch_repo.get_brought_forward(db, winch_id, day)
    
    return ExportDataResponse(
        winch=winch,
        logs=day_logs,
        launches=launches,
        operators=operators,
        brought_forward={"left": bf_data.get("left"), "right": bf_data.get("right")}
    )
