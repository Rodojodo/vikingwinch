from datetime import date, datetime, timezone
from domain.stars.model import OperatorQualifications
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


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
        c005_expiry: date | None = None,
    e004_instructor: str = "nil",
        e004_expiry: date | None = None,
    c003_examiner: str = "nil",
        c003_expiry: date | None = None,
    rolling_currency: str = "nil",
        rolling_expiry: date | None = None,
        is_stale: bool = False,
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
            c005_expiry=c005_expiry,
            e004_instructor=e004_instructor,
            e004_expiry=e004_expiry,
            c003_examiner=c003_examiner,
            c003_expiry=c003_expiry,
            rolling_currency=rolling_currency,
            rolling_expiry=rolling_expiry,
            is_stale=is_stale,
            last_checked_at=last_checked_at,
        )
        db.add(quals)
    else:
        quals.stars_resource_id = stars_resource_id
        quals.c005_operator = c005_operator
        quals.c005_expiry = c005_expiry
        quals.e004_instructor = e004_instructor
        quals.e004_expiry = e004_expiry
        quals.c003_examiner = c003_examiner
        quals.c003_expiry = c003_expiry
        quals.rolling_currency = rolling_currency
        quals.rolling_expiry = rolling_expiry
        quals.is_stale = is_stale
        quals.last_checked_at = last_checked_at

    await db.flush()
    return quals
