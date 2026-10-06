from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import Principal, authorize_admin, get_current_principal
from database.session import get_db
from domain.reset.service import reset_is_available, reset_testvgs

router = APIRouter(tags=["development"])


@router.post("/dev/reset-testvgs")
async def reset_testvgs_endpoint(
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    authorize_admin(principal)
    if not reset_is_available():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Development reset is unavailable",
        )
    return await reset_testvgs(db, principal.operator_sn or "")
