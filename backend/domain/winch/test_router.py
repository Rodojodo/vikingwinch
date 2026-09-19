import pytest_asyncio
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from datetime import date, datetime, timezone, timedelta
from domain.squadron.model import Squadron
from domain.winch.model import Winch
from domain.operator.model import Operator
from domain.day_log.model import Day_Log
from domain.launch.model import Launch
from main import app

@pytest_asyncio.fixture
async def setup_data(db_session):
    sqn = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="VX001", squadron_id="123 VGS")
    op = Operator(service_no="123456", entra_oid="oid1", name="Test Op", squadron_id="123 VGS", qualification_level="operator")
    
    db_session.add_all([sqn, winch, op])
    await db_session.flush()

    day_log = Day_Log(
        squadron_id="123 VGS", winch_id=1, type="sign_on", operator_sn="123456", hours=100.5, timestamp=datetime.now(timezone.utc)
    )
    
    launch = Launch(
        squadron_id="123 VGS", winch_id=1, drum="left", launch_number=1,
        timestamp=datetime.now(timezone.utc), operator_sn="123456"
    )
    launch2 = Launch(
        squadron_id="123 VGS", winch_id=1, drum="right", launch_number=2,
        timestamp=datetime.now(timezone.utc) - timedelta(days=1), operator_sn="123456"
    )
    db_session.add_all([day_log, launch, launch2])
    await db_session.commit()

@pytest.mark.asyncio
async def test_get_bf_info(setup_data):
    today = date.today().isoformat()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/winch/1/bf_info?day={today}")
    assert response.status_code == 200
    data = response.json()
    assert data["hours"] == 100.5
    assert data["right"] == 2
    assert data["left"] is None

@pytest.mark.asyncio
async def test_get_winch_day_data(setup_data):
    today = date.today().isoformat()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/winch/1/day_data?day={today}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["logs"]) == 1
    assert len(data["launches"]) == 1
    assert data["launches"][0]["drum"] == "left"

@pytest.mark.asyncio
async def test_get_export_data(setup_data):
    today = date.today().isoformat()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/winch/1/export_data?squadron_id=123%20VGS&day={today}")
    assert response.status_code == 200
    data = response.json()
    assert data["winch"]["registration"] == "VX001"
    assert len(data["operators"]) == 1
    assert data["brought_forward"]["right"] == 2




@pytest.mark.asyncio
async def test_create_day_log_rollback(db_session):
    # Setup test winch
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn2')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (999, 'Winch 999', 'sqn2')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('12345', 'oid', 'Op', 'sqn2', 'operator')"))
    await db_session.commit()
    
    payload = {
        "squadron_id": "sqn2",
        "type": "di",
        "operator_sn": "12345",
        "hours": 100.5
    }

    # Patch the repository to raise an exception halfway
    with patch('domain.day_log.repository.add_day_log', side_effect=Exception("DB Error mid-flush")):
        async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
            response = await ac.post("/winch/999/day_log", json=payload)
            assert response.status_code == 500
    
    # Assert partial failure rolls back
    result = await db_session.execute(text("SELECT COUNT(*) FROM day_log WHERE winch_id = 999"))
    assert result.scalar() == 0


@pytest.mark.asyncio
async def test_create_day_log_success(db_session):
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn10')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (1001, 'Winch 1001', 'sqn10')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('op10', 'oid10', 'Op10', 'sqn10', 'operator')"))
    await db_session.commit()
    
    payload = {
        "squadron_id": "sqn10",
        "type": "di",
        "operator_sn": "op10",
        "hours": 200.5
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/winch/1001/day_log", json=payload)
        assert response.status_code == 201
    
    result = await db_session.execute(text("SELECT COUNT(*) FROM day_log WHERE winch_id = 1001"))
    assert result.scalar() == 1


@pytest.mark.asyncio
async def test_get_export_data_ordering_and_remarks(db_session):
    day = date(2026, 6, 6)
    day_str = day.isoformat()

    sqn = Squadron(id="600 VGS")
    winch = Winch(id=600, registration="VX600", squadron_id="600 VGS")
    op = Operator(service_no="SN600", entra_oid="oid600", name="Op 600", squadron_id="600 VGS", qualification_level="operator")
    db_session.add_all([sqn, winch, op])
    await db_session.commit()

    l1 = Launch(squadron_id="600 VGS", winch_id=600, drum="left", launch_number=100, timestamp=datetime(2026, 6, 6, 9, 0, 0), operator_sn="SN600")
    l2 = Launch(squadron_id="600 VGS", winch_id=600, drum="left", launch_number=20, remarks="corrected brought forward", timestamp=datetime(2026, 6, 6, 9, 30, 0), operator_sn="SN600")
    l3 = Launch(squadron_id="600 VGS", winch_id=600, drum="left", launch_number=21, timestamp=datetime(2026, 6, 6, 10, 0, 0), operator_sn="SN600")
    db_session.add_all([l1, l2, l3])
    await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/winch/600/export_data?squadron_id=600%20VGS&day={day_str}")
    assert response.status_code == 200
    data = response.json()
    launches = data["launches"]
    assert len(launches) == 3
    # Check ordered by launch_id ASC
    launch_ids = [entry["launch_id"] for entry in launches]
    assert launch_ids == sorted(launch_ids)
    # Check remarks preserved
    assert launches[1]["remarks"] == "corrected brought forward"
    assert launches[1]["launch_number"] == 20


@pytest.mark.asyncio
async def test_get_bf_info_with_prior_day_correction(db_session):
    sqn = Squadron(id="700 VGS")
    winch = Winch(id=700, registration="VX700", squadron_id="700 VGS")
    op = Operator(service_no="SN700", entra_oid="oid700", name="Op 700", squadron_id="700 VGS", qualification_level="operator")
    db_session.add_all([sqn, winch, op])
    await db_session.commit()

    # Day 1: normal launch 10, then correction 50
    l1 = Launch(squadron_id="700 VGS", winch_id=700, drum="left", launch_number=10, timestamp=datetime(2026, 6, 1, 9, 0, 0), operator_sn="SN700")
    c1 = Launch(squadron_id="700 VGS", winch_id=700, drum="left", launch_number=50, remarks="corrected brought forward", timestamp=datetime(2026, 6, 1, 9, 30, 0), operator_sn="SN700")
    db_session.add_all([l1, c1])
    await db_session.commit()

    day2_str = "2026-06-02"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/winch/700/bf_info?day={day2_str}")
    assert response.status_code == 200
    data = response.json()
    assert data["left"] == 50
    assert data["right"] is None
