from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from repositories import launch_repo
from core.schemas import LaunchCreate, LaunchRead, RemarkCreate, RepairCreate, BroughtForwardRead

router = APIRouter(prefix="/launches", tags=["launches"])


@router.post("", response_model=LaunchRead, status_code=status.HTTP_201_CREATED)
async def create_launch(
    payload: LaunchCreate,
    db: AsyncSession = Depends(get_db),
):
    launch = await launch_repo.add_launch(
        db,
        squadron_id=payload.squadron_id,
        winch_id=payload.winch_id,
        operator_sn=payload.operator_sn,
        drum=payload.drum,
        is_burn=payload.is_burn,
    )
    # add_launch only flushes; the route owns the transaction boundary.
    await db.commit()
    return launch


@router.delete("/{launch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_launch(
    launch_id: int,
    db: AsyncSession = Depends(get_db),
):
    launch = await launch_repo.delete_launch(db, launch_id)
    if not launch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Launch not found")
    await db.commit()
    return None


@router.post("/remarks", response_model=LaunchRead)
async def add_remark(
    payload: RemarkCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await launch_repo.add_remark_to_launch(
            db, payload.launch_id, payload.remark
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/repairs", response_model=LaunchRead)
async def add_repair(
    payload: RepairCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await launch_repo.add_repair_to_launch(
            db, payload.launch_id, payload.repair, payload.supervisor_id
        )
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
    
@router.get("/brought_forward", response_model=BroughtForwardRead)
async def get_brought_forward(
    winch_id: int,
    day: date,
    db: AsyncSession = Depends(get_db),
):
    """Last non-burned launch number for each drum prior to the given date."""
    return await launch_repo.get_brought_forward(db, winch_id, day)