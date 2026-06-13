from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.squadron import Squadron


async def squadron_exists(db: AsyncSession, id: str):
    stmt = select(Squadron).where(Squadron.id == id)
    result = await db.execute(stmt)
    squadron = result.scalar_one_or_none()
    return squadron is not None
