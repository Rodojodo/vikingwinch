from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from domain.stars.client import StarsClient
from domain.stars.model import OperatorQualifications
from domain.stars import repository as stars_repo

CACHE_TTL = timedelta(days=7)


def _is_cache_fresh(quals: OperatorQualifications) -> bool:
    if not quals.last_checked_at:
        return False
    last_checked = quals.last_checked_at
    if last_checked.tzinfo is None:
        last_checked = last_checked.replace(tzinfo=timezone.utc)
    now_utc = datetime.now(timezone.utc)
    return (now_utc - last_checked) <= CACHE_TTL


async def refresh_qualifications(
    db: AsyncSession,
    service_no: str,
    client: StarsClient | None = None,
) -> OperatorQualifications:
    if client is None:
        client = StarsClient()

    fetched = client.fetch_user_qualifications(service_no)
    now = datetime.now(timezone.utc)
    quals = await stars_repo.upsert_qualifications(
        db,
        service_no=service_no,
        stars_resource_id=fetched.get("stars_resource_id"),
        c005_operator=fetched.get("c005_operator", "nil"),
        e004_instructor=fetched.get("e004_instructor", "nil"),
        c003_examiner=fetched.get("c003_examiner", "nil"),
        rolling_currency=fetched.get("rolling_currency", "nil"),
        last_checked_at=now,
    )
    return quals


async def get_or_refresh_qualifications(
    db: AsyncSession,
    service_no: str,
    client: StarsClient | None = None,
) -> OperatorQualifications:
    quals = await stars_repo.get_qualifications_by_sn(db, service_no)
    if quals is not None and _is_cache_fresh(quals):
        return quals

    return await refresh_qualifications(db, service_no, client)
