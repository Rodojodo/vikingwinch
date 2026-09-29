from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from auth import Principal, authorize_squadron, get_current_principal
from database.session import get_db
from domain.squadron import repository as squadron_repo
from domain.squadron.schema import SquadronExistsResponse

router = APIRouter(prefix="/squadrons", tags=["squadrons"], dependencies=[Depends(get_current_principal)])


@router.get("/{squadron_id}/exists", response_model=SquadronExistsResponse)
async def squadron_exists(
    squadron_id: str,
    db: AsyncSession = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    authorize_squadron(principal, squadron_id)
    exists = await squadron_repo.squadron_exists(db, squadron_id)
    return SquadronExistsResponse(id=squadron_id, exists=exists)