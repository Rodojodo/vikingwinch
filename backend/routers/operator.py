from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from repositories import operator_repo
from core.schemas import OperatorRead

router = APIRouter(tags=["operators"])


@router.get("/operators/{service_no}", response_model=OperatorRead)
async def get_operator(
    service_no: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await operator_repo.get_operator_from_sn(db, service_no)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/squadrons/{squadron_id}/operators", response_model=list[OperatorRead])
async def get_operators_for_squadron(
    squadron_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await operator_repo.get_operators_from_sqn(db, squadron_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))