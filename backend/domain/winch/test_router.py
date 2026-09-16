import pytest_asyncio
import pytest
from httpx import AsyncClient, ASGITransport
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

from unittest.mock import patch
from sqlalchemy import text
from httpx import AsyncClient

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
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            try:
                response = await ac.post("/winch/999/day_log", json=payload)
                assert response.status_code == 500
            except Exception:
                pass
    
    # Assert partial failure rolls back
    result = await db_session.execute(text("SELECT COUNT(*) FROM day_logs WHERE winch_id = 999"))
    assert result.scalar() == 0

