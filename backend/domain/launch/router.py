from datetime import date, datetime, timezone, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from domain.day_log import repository as day_log_repo
from domain.launch import repository as launch_repo
from domain.winch.model import Winch
from domain.launch.schema import (
    LaunchCreate,
    LaunchRead,
    RemarkCreate,
    RepairCreate,
    LaunchCorrectionCreate,
)

router = APIRouter(prefix="/launches", tags=["launches"])


@router.post("", response_model=LaunchRead, status_code=status.HTTP_201_CREATED)
async def create_launch(
    payload: LaunchCreate,
    db: AsyncSession = Depends(get_db),
):
    async with db.begin():
        launch = await launch_repo.add_launch(
            db,
            squadron_id=payload.squadron_id,
            winch_id=payload.winch_id,
            operator_sn=payload.operator_sn,
            drum=payload.drum,
            is_burn=payload.is_burn,
        )
    return launch


@router.post("/corrections", response_model=list[LaunchRead], status_code=status.HTTP_201_CREATED)
async def create_launch_correction(
    payload: LaunchCorrectionCreate,
    db: AsyncSession = Depends(get_db),
):
    today = datetime.now(timezone.utc).date()
    async with db.begin():
        await db.execute(select(Winch.id).where(Winch.id == payload.winch_id).with_for_update())

        di = await day_log_repo.get_di_for_day(db, payload.winch_id, today)
        if not di:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A signed Daily Inspection (DI) for this winch on today's date is required before recording corrections",
            )

        payload_sqn = payload.squadron_id.strip() if payload.squadron_id else None
        payload_op = payload.operator_sn.strip() if payload.operator_sn else None

        squadron_id = payload_sqn or di.squadron_id
        operator_sn = payload_op or di.operator_sn

        if not squadron_id or not operator_sn:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing squadron_id or operator_sn for launch correction",
            )

        correction_timestamp = datetime.combine(today, time.min) - timedelta(seconds=1)

        results = []
        if payload.left is not None:
            left_launch = await launch_repo.add_launch_correction(
                db_session=db,
                squadron_id=squadron_id,
                winch_id=payload.winch_id,
                operator_sn=operator_sn,
                drum="left",
                launch_num=payload.left,
                remarks="corrected brought forward",
                timestamp=correction_timestamp,
            )
            results.append(left_launch)

        if payload.right is not None:
            right_launch = await launch_repo.add_launch_correction(
                db_session=db,
                squadron_id=squadron_id,
                winch_id=payload.winch_id,
                operator_sn=operator_sn,
                drum="right",
                launch_num=payload.right,
                remarks="corrected brought forward",
                timestamp=correction_timestamp,
            )
            results.append(right_launch)

    return results


@router.delete("/{launch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_launch(
    launch_id: int,
    db: AsyncSession = Depends(get_db),
):
    async with db.begin():
        launch = await launch_repo.delete_launch(db, launch_id)
        if not launch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Launch not found")
    return None


@router.post("/remarks", response_model=LaunchRead)
async def add_remark(
    payload: RemarkCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        async with db.begin():
            launch = await launch_repo.add_remark_to_launch(
                db, payload.launch_id, payload.remark
            )
        return launch
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/repairs", response_model=LaunchRead)
async def add_repair(
    payload: RepairCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        async with db.begin():
            launch = await launch_repo.add_repair_to_launch(
                db, payload.launch_id, payload.repair, payload.supervisor_id
            )
        return launch
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("", response_model=list[LaunchRead])
async def get_launches(
    winch_id: int,
    day: date,
    db: AsyncSession = Depends(get_db),
):
    """All launches for a winch on a given date (?winch_id=N&day=YYYY-MM-DD)."""
    return await launch_repo.get_launches_from_date(db, winch_id, day)
