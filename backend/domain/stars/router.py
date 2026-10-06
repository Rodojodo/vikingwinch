from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import Principal, get_current_principal
from database.session import get_db
from domain.stars import service as stars_service
from domain.stars.schema import OperatorQualificationsRead

router = APIRouter(tags=["qualifications"], dependencies=[Depends(get_current_principal)])


@router.get("/operators/me/qualifications", response_model=OperatorQualificationsRead)
async def get_my_qualifications(
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    if not principal.operator_sn:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user is not mapped to an operator",
        )
    try:
        quals = await stars_service.get_or_refresh_qualifications(db, principal.operator_sn)
        await db.commit()
        return quals
    except Exception:
        await db.rollback()
        raise


@router.post("/operators/me/qualifications/refresh", response_model=OperatorQualificationsRead)
async def refresh_my_qualifications(
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    if not principal.operator_sn:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user is not mapped to an operator",
        )
    try:
        quals = await stars_service.refresh_qualifications(db, principal.operator_sn)
        await db.commit()
        return quals
    except Exception:
        await db.rollback()
        raise
