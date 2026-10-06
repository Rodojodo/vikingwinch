from datetime import datetime, timezone
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from domain.squadron.model import Squadron
from domain.operator.model import Operator
from domain.stars.model import OperatorQualifications
from domain.stars import repository as stars_repo


@pytest.mark.asyncio
async def test_get_qualifications_nonexistent(db_session: AsyncSession):
    qual = await stars_repo.get_qualifications_by_sn(db_session, "nonexistent-sn")
    assert qual is None


@pytest.mark.asyncio
async def test_upsert_and_get_qualifications(db_session: AsyncSession):
    # Setup prerequisite squadron and operator
    sqn = Squadron(id="123 VGS")
    db_session.add(sqn)
    await db_session.flush()

    op = Operator(
        service_no="OFF-1001",
        auth_provider="clerk",
        auth_subject="user_123",
        name="Joe Bloggs",
        squadron_id="123 VGS",
        qualification_level="operator",
    )
    db_session.add(op)
    await db_session.commit()

    now = datetime.now(timezone.utc)
    quals = await stars_repo.upsert_qualifications(
        db_session,
        service_no="OFF-1001",
        stars_resource_id="R:12345",
        c005_operator="green",
        e004_instructor="green",
        c003_examiner="none",
        rolling_currency="green",
        last_checked_at=now,
    )
    await db_session.commit()

    assert quals.service_no == "OFF-1001"
    assert quals.stars_resource_id == "R:12345"
    assert quals.c005_operator == "green"
    assert quals.e004_instructor == "green"
    assert quals.c003_examiner == "none"
    assert quals.rolling_currency == "green"
    assert quals.last_checked_at == now

    # Retrieve by service number
    retrieved = await stars_repo.get_qualifications_by_sn(db_session, "OFF-1001")
    assert retrieved is not None
    assert retrieved.service_no == "OFF-1001"
    assert retrieved.c005_operator == "green"


@pytest.mark.asyncio
async def test_upsert_updates_existing_record(db_session: AsyncSession):
    sqn = Squadron(id="123 VGS")
    db_session.add(sqn)
    await db_session.flush()

    op = Operator(
        service_no="OFF-1002",
        auth_provider="clerk",
        auth_subject="user_456",
        name="Emily Clack",
        squadron_id="123 VGS",
        qualification_level="operator",
    )
    db_session.add(op)
    await db_session.commit()

    t1 = datetime(2026, 1, 1, tzinfo=timezone.utc)
    await stars_repo.upsert_qualifications(
        db_session,
        service_no="OFF-1002",
        stars_resource_id="R:9999",
        c005_operator="amber",
        e004_instructor="nil",
        c003_examiner="nil",
        rolling_currency="nil",
        last_checked_at=t1,
    )
    await db_session.commit()

    t2 = datetime(2026, 1, 10, tzinfo=timezone.utc)
    updated = await stars_repo.upsert_qualifications(
        db_session,
        service_no="OFF-1002",
        stars_resource_id="R:9999",
        c005_operator="green",
        e004_instructor="green",
        c003_examiner="green",
        rolling_currency="green",
        last_checked_at=t2,
    )
    await db_session.commit()

    assert updated.c005_operator == "green"
    assert updated.e004_instructor == "green"
    assert updated.last_checked_at == t2
