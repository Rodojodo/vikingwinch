from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.operator import Operator
from repositories.squadron_repo import squadron_exists


async def get_operator_from_sn(db: AsyncSession, service_no: str):
    stmt = select(Operator).where(Operator.service_no == service_no)
    result = await db.execute(stmt)
    operator = result.scalar_one_or_none()
    if operator is None:
        raise ValueError("Operator not found")
    return operator


async def get_operators_from_sqn(db: AsyncSession, squadron: str):
    valid_squadron = await squadron_exists(db, squadron)
    if valid_squadron is False:
        raise ValueError("Squadron not found")
    stmt = select(Operator).where(Operator.squadron_id == squadron)
    result = await db.execute(stmt)
    operators = result.scalars().all()
    if len(operators) == 0:
        raise ValueError("Operators not found")
    return operators

