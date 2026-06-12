from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from repositories import winch_repo
from core.schemas import WinchRead

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