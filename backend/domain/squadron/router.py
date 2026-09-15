from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from domain.squadron import repository as squadron_repo
from core.schemas import SquadronExistsResponse

router = APIRouter(prefix="/squadrons", tags=["squadrons"])


@router.get("/{squadron_id}/exists", response_model=SquadronExistsResponse)
async def squadron_exists(
    squadron_id: str,
    db: AsyncSession = Depends(get_db),
):
    exists = await squadron_repo.squadron_exists(db, squadron_id)
    return SquadronExistsResponse(id=squadron_id, exists=exists)