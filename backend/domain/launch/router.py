from datetime import date, datetime, timezone, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import Principal, authorize_operator, authorize_winch, get_current_principal
from database.session import get_db
from domain.day_log import repository as day_log_repo
from domain.launch import repository as launch_repo
from domain.winch.model import Winch
from domain.launch.model import Launch
from domain.launch.schema import (
    LaunchCreate,
    LaunchRead,
    RemarkCreate,
    RepairCreate,
    LaunchCorrectionCreate,
)

router = APIRouter(prefix="/launches", tags=["launches"], dependencies=[Depends(get_current_principal)])
FINISHED_DAY_ERROR = "The day has already been finished; no further launches can be recorded."


@router.post("", response_model=LaunchRead, status_code=status.HTTP_201_CREATED)
async def create_launch(
    payload: LaunchCreate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    today = datetime.now(timezone.utc).date()
    try:
        winch = await authorize_winch(db, principal, payload.winch_id)
        operator = await authorize_operator(db, principal, payload.operator_sn)
        if payload.squadron_id != winch.squadron_id or operator.squadron_id != winch.squadron_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Launch squadron and operator must match the authorized winch",
            )
        await db.execute(select(Winch.id).where(Winch.id == payload.winch_id).with_for_update())

        if await day_log_repo.has_finish_day_for_day(db, payload.winch_id, today):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=FINISHED_DAY_ERROR,
            )

        if not await day_log_repo.has_cable_check_for_day(db, payload.winch_id, today):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A cable check must be signed before launches can be recorded.",
            )

        launch = await launch_repo.add_launch(
            db,
            squadron_id=payload.squadron_id,
            winch_id=payload.winch_id,
            operator_sn=payload.operator_sn,
            drum=payload.drum,
            is_burn=payload.is_burn,
        )
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return launch


@router.post("/corrections", response_model=list[LaunchRead], status_code=status.HTTP_201_CREATED)
async def create_launch_correction(
    payload: LaunchCorrectionCreate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    today = datetime.now(timezone.utc).date()
    try:
        winch = await authorize_winch(db, principal, payload.winch_id)
        await db.execute(select(Winch.id).where(Winch.id == payload.winch_id).with_for_update())

        if await day_log_repo.has_finish_day_for_day(db, payload.winch_id, today):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=FINISHED_DAY_ERROR,
            )

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
        operator = await authorize_operator(db, principal, operator_sn)
        if squadron_id != winch.squadron_id or operator.squadron_id != winch.squadron_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Correction squadron and operator must match the authorized winch",
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
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return results


@router.delete("/{launch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_launch(
    launch_id: int,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    try:
        existing = await db.get(Launch, launch_id)
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Launch not found")
        await authorize_winch(db, principal, existing.winch_id)
        launch = await launch_repo.delete_launch(db, launch_id)
        if not launch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Launch not found")
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return None


@router.post("/remarks", response_model=LaunchRead)
async def add_remark(
    payload: RemarkCreate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    try:
        existing = await db.get(Launch, payload.launch_id)
        if existing is None:
            raise ValueError("No previous launch")
        await authorize_winch(db, principal, existing.winch_id)
        launch = await launch_repo.add_remark_to_launch(
            db, payload.launch_id, payload.remark
        )
        await db.commit()
        return launch
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception:
        await db.rollback()
        raise


@router.post("/repairs", response_model=LaunchRead)
async def add_repair(
    payload: RepairCreate,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    try:
        existing = await db.get(Launch, payload.launch_id)
        if existing is None:
            raise ValueError("No previous launch")
        await authorize_winch(db, principal, existing.winch_id)
        launch = await launch_repo.add_repair_to_launch(
            db, payload.launch_id, payload.repair, payload.supervisor_id
        )
        await db.commit()
        return launch
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception:
        await db.rollback()
        raise


@router.get("", response_model=list[LaunchRead])
async def get_launches(
    winch_id: int,
    day: date,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    """All launches for a winch on a given date (?winch_id=N&day=YYYY-MM-DD)."""
    await authorize_winch(db, principal, winch_id)
    return await launch_repo.get_launches_from_date(db, winch_id, day)
