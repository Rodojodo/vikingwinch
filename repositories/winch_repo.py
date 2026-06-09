from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.winch import Winch
from repositories.squadron_repo import squadron_exists


async def get_winch_from_id(db: AsyncSession, id: str):
    stmt = select(Winch).where(Winch.id == id)
    result = await db.execute(stmt)
    winch = result.scalar_one_or_none()
    if winch is None:
        raise ValueError("Winch not found")
    return winch


async def get_winches_from_sqn(db: AsyncSession, squadron: str):
    valid_squadron = await squadron_exists(db, squadron)
    if valid_squadron is False:
        raise ValueError("Squadron not found")
    stmt = select(Winch).where(Winch.squadron_id == squadron)
    result = await db.execute(stmt)
    winchs = result.scalars().all()
    if len(winchs) == 0:
        raise ValueError("Winches not found")
    return winchs

