from datetime import datetime, timezone, timedelta
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from domain.squadron.model import Squadron
from domain.operator.model import Operator
from domain.stars.model import OperatorQualifications
from auth import Principal, get_current_principal
from main import app


import pytest_asyncio

@pytest.fixture(autouse=True)
def enable_mock_stars(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "true")


@pytest_asyncio.fixture
async def setup_operator(db_session: AsyncSession):
    sqn = Squadron(id="123 VGS")
    op = Operator(
        service_no="test-operator",
        auth_provider="test",
        auth_subject="test-subject",
        name="Test Operator",
        squadron_id="123 VGS",
        qualification_level="operator",
    )
    db_session.add_all([sqn, op])
    await db_session.commit()


@pytest.mark.asyncio
async def test_get_qualifications_me_creates_cache_on_miss(setup_operator):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/operators/me/qualifications")
    assert resp.status_code == 200
    data = resp.json()
    assert data["service_no"] == "test-operator"
    assert data["c005_operator"] == "green"
    assert data["e004_instructor"] == "green"
    assert data["rolling_currency"] == "green"
    assert data["last_checked_at"] is not None


@pytest.mark.asyncio
async def test_get_qualifications_me_returns_cached_within_ttl(setup_operator, db_session: AsyncSession):
    # Pre-populate with fresh cache (1 day ago) and custom state
    one_day_ago = datetime.now(timezone.utc) - timedelta(days=1)
    quals = OperatorQualifications(
        service_no="test-operator",
        stars_resource_id="R:CACHED",
        c005_operator="amber",
        e004_instructor="nil",
        c003_examiner="nil",
        rolling_currency="green",
        last_checked_at=one_day_ago,
    )
    db_session.add(quals)
    await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/operators/me/qualifications")
    assert resp.status_code == 200
    data = resp.json()
    # Should return cached values without re-fetching mock default (which has c005="green")
    assert data["c005_operator"] == "amber"
    assert data["stars_resource_id"] == "R:CACHED"


@pytest.mark.asyncio
async def test_get_qualifications_me_refreshes_when_cache_expired(setup_operator, db_session: AsyncSession):
    # Pre-populate with expired cache (8 days ago)
    eight_days_ago = datetime.now(timezone.utc) - timedelta(days=8)
    quals = OperatorQualifications(
        service_no="test-operator",
        stars_resource_id="R:OLD",
        c005_operator="red",
        e004_instructor="red",
        c003_examiner="red",
        rolling_currency="red",
        last_checked_at=eight_days_ago,
    )
    db_session.add(quals)
    await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/operators/me/qualifications")
    assert resp.status_code == 200
    data = resp.json()
    # Cache > 7 days triggers re-fetch; mock mode returns green
    assert data["c005_operator"] == "green"
    assert data["stars_resource_id"] == "R:MOCK_DEFAULT"


@pytest.mark.asyncio
async def test_post_qualifications_refresh_forces_live_fetch(setup_operator, db_session: AsyncSession):
    # Pre-populate fresh cache with amber
    quals = OperatorQualifications(
        service_no="test-operator",
        stars_resource_id="R:FRESH",
        c005_operator="amber",
        e004_instructor="nil",
        c003_examiner="nil",
        rolling_currency="amber",
        last_checked_at=datetime.now(timezone.utc),
    )
    db_session.add(quals)
    await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/operators/me/qualifications/refresh")
    assert resp.status_code == 200
    data = resp.json()
    # POST refresh bypasses cache TTL and immediately updates
    assert data["c005_operator"] == "green"
    assert data["stars_resource_id"] == "R:MOCK_DEFAULT"


@pytest.mark.asyncio
async def test_get_qualifications_unauthorized_when_no_operator_sn(setup_operator):
    app.dependency_overrides[get_current_principal] = lambda: Principal(
        provider="test",
        mode="individual_operator",
        subject="test-subject",
        squadron_id="123 VGS",
        operator_sn="",
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/operators/me/qualifications")
    assert resp.status_code == 403
