import pytest
import pytest_asyncio
from datetime import datetime, timezone
from domain.day_log.schema import DayLogCreate
from domain.operator.model import Operator
from domain.squadron.model import Squadron
from domain.stars.model import OperatorQualifications
from domain.winch.model import Winch
from httpx import AsyncClient, ASGITransport
from main import app
from sqlalchemy.ext.asyncio import AsyncSession


@pytest_asyncio.fixture
async def setup_env(db_session: AsyncSession):
    sqn = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="VX001", squadron_id="123 VGS")
    op = Operator(
        service_no="test-operator",
        auth_provider="test",
        auth_subject="test-subject",
        name="Test Operator",
        squadron_id="123 VGS",
        qualification_level="operator",
    )
    trainee = Operator(
        service_no="trainee-sn",
        auth_provider="test",
        auth_subject="trainee-subject",
        name="Trainee",
        squadron_id="123 VGS",
        qualification_level="trainee",
    )
    db_session.add_all([sqn, winch, op, trainee])
    await db_session.commit()


@pytest.mark.asyncio
async def test_create_di_forbidden_when_c005_invalid(setup_env, db_session: AsyncSession):
    quals = OperatorQualifications(
        service_no="test-operator",
        c005_operator="red",
        e004_instructor="green",
        c003_examiner="nil",
        rolling_currency="green",
        last_checked_at=datetime.now(timezone.utc),
    )
    db_session.add(quals)
    await db_session.commit()

    payload = {
        "squadron_id": "123 VGS",
        "type": "di",
        "operator_sn": "test-operator",
        "hours": 50.0,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/winch/1/day_log", json=payload)
    assert resp.status_code == 403
    assert "C005 Winch Operator green/amber required" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_create_di_success_when_c005_green(setup_env, db_session: AsyncSession):
    quals = OperatorQualifications(
        service_no="test-operator",
        c005_operator="green",
        e004_instructor="nil",
        c003_examiner="nil",
        rolling_currency="green",
        last_checked_at=datetime.now(timezone.utc),
    )
    db_session.add(quals)
    await db_session.commit()

    payload = {
        "squadron_id": "123 VGS",
        "type": "di",
        "operator_sn": "test-operator",
        "hours": 50.0,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/winch/1/day_log", json=payload)
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_sign_on_forbidden_when_no_valid_qualifications(setup_env, db_session: AsyncSession):
    quals = OperatorQualifications(
        service_no="test-operator",
        c005_operator="nil",
        e004_instructor="red",
        c003_examiner="blue",
        rolling_currency="green",
        last_checked_at=datetime.now(timezone.utc),
    )
    db_session.add(quals)
    await db_session.commit()

    payload = {
        "squadron_id": "123 VGS",
        "type": "sign_on",
        "operator_sn": "test-operator",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/winch/1/day_log", json=payload)
    assert resp.status_code == 403
    assert "No valid winching qualifications held" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_sign_on_solo_with_trainee_rejected(setup_env, db_session: AsyncSession):
    quals = OperatorQualifications(
        service_no="test-operator",
        c005_operator="green",
        e004_instructor="nil",
        c003_examiner="nil",
        rolling_currency="green",
        last_checked_at=datetime.now(timezone.utc),
    )
    db_session.add(quals)
    await db_session.commit()

    payload = {
        "squadron_id": "123 VGS",
        "type": "sign_on",
        "operator_sn": "test-operator",
        "trainee": "some-trainee",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/winch/1/day_log", json=payload)
    assert resp.status_code == 400
    assert "Solo operators cannot sign on with a trainee" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_sign_on_dual_without_trainee_rejected(setup_env, db_session: AsyncSession):
    quals = OperatorQualifications(
        service_no="test-operator",
        c005_operator="nil",
        e004_instructor="green",
        c003_examiner="nil",
        rolling_currency="green",
        last_checked_at=datetime.now(timezone.utc),
    )
    db_session.add(quals)
    await db_session.commit()

    payload = {
        "squadron_id": "123 VGS",
        "type": "sign_on",
        "operator_sn": "test-operator",
        "trainee": None,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/winch/1/day_log", json=payload)
    assert resp.status_code == 400
    assert "Instructors/Examiners must sign on with a trainee" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_sign_on_dual_with_trainee_success(setup_env, db_session: AsyncSession):
    quals = OperatorQualifications(
        service_no="test-operator",
        c005_operator="nil",
        e004_instructor="green",
        c003_examiner="nil",
        rolling_currency="green",
        last_checked_at=datetime.now(timezone.utc),
    )
    db_session.add(quals)
    await db_session.commit()

    payload = {
        "squadron_id": "123 VGS",
        "type": "sign_on",
        "operator_sn": "test-operator",
        "trainee": "trainee-sn",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/winch/1/day_log", json=payload)
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_sign_on_both_solo_and_dual_permits_both(setup_env, db_session: AsyncSession):
    quals = OperatorQualifications(
        service_no="test-operator",
        c005_operator="green",
        e004_instructor="green",
        c003_examiner="nil",
        rolling_currency="green",
        last_checked_at=datetime.now(timezone.utc),
    )
    db_session.add(quals)
    await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Solo sign-on
        resp_solo = await ac.post(
            "/winch/1/day_log",
            json={"squadron_id": "123 VGS", "type": "sign_on", "operator_sn": "test-operator"},
        )
        assert resp_solo.status_code == 201

        # Dual sign-on with trainee
        resp_dual = await ac.post(
            "/winch/1/day_log",
            json={
                "squadron_id": "123 VGS",
                "type": "sign_on",
                "operator_sn": "test-operator",
                "trainee": "trainee-sn",
            },
        )
        assert resp_dual.status_code == 201
