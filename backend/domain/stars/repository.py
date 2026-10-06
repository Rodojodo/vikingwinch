from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.stars.model import OperatorQualifications


async def get_qualifications_by_sn(
    db: AsyncSession, service_no: str
) -> OperatorQualifications | None:
    stmt = select(OperatorQualifications).where(
        OperatorQualifications.service_no == service_no
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def upsert_qualifications(
    db: AsyncSession,
    service_no: str,
    stars_resource_id: str | None = None,
    c005_operator: str = "nil",
    e004_instructor: str = "nil",
    c003_examiner: str = "nil",
    rolling_currency: str = "nil",
    last_checked_at: datetime | None = None,
) -> OperatorQualifications:
    if last_checked_at is None:
        last_checked_at = datetime.now(timezone.utc)

    quals = await get_qualifications_by_sn(db, service_no)
    if quals is None:
        quals = OperatorQualifications(
            service_no=service_no,
            stars_resource_id=stars_resource_id,
            c005_operator=c005_operator,
            e004_instructor=e004_instructor,
            c003_examiner=c003_examiner,
            rolling_currency=rolling_currency,
            last_checked_at=last_checked_at,
        )
        db.add(quals)
    else:
        quals.stars_resource_id = stars_resource_id
        quals.c005_operator = c005_operator
        quals.e004_instructor = e004_instructor
        quals.c003_examiner = c003_examiner
        quals.rolling_currency = rolling_currency
        quals.last_checked_at = last_checked_at

    await db.flush()
    return quals
