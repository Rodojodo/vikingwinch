import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from unittest.mock import patch
from main import app

@pytest.mark.asyncio
async def test_create_launch_rollback(db_session):
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn3')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (888, 'Winch 888', 'sqn3')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('12345', 'oid', 'Op', 'sqn3', 'operator')"))
    await db_session.commit()

    payload = {
        "squadron_id": "sqn3",
        "winch_id": 888,
        "operator_sn": "12345",
        "drum": "left",
        "is_burn": False
    }

    with patch('domain.launch.repository.add_launch', side_effect=Exception("Simulated DB Error")):
        async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
            response = await ac.post("/launches", json=payload)
            assert response.status_code == 500
    
    result = await db_session.execute(text("SELECT COUNT(*) FROM launches WHERE winch_id = 888"))
    assert result.scalar() == 0


@pytest.mark.asyncio
async def test_create_launch_success(db_session):
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn4')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (889, 'Winch 889', 'sqn4')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('123456', 'oid2', 'Op2', 'sqn4', 'operator')"))
    await db_session.commit()

    payload = {
        "squadron_id": "sqn4",
        "winch_id": 889,
        "operator_sn": "123456",
        "drum": "left",
        "is_burn": False
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches", json=payload)
        assert response.status_code == 201
    
    result = await db_session.execute(text("SELECT COUNT(*) FROM launches WHERE winch_id = 889"))
    assert result.scalar() == 1

@pytest.mark.asyncio
async def test_delete_launch_success(db_session):
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn5')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (890, 'Winch 890', 'sqn5')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('op3', 'oid3', 'Op3', 'sqn5', 'operator')"))
    await db_session.execute(text("INSERT INTO launches (launch_id, squadron_id, winch_id, drum, launch_number, timestamp, operator_sn) VALUES (99, 'sqn5', 890, 'left', 1, '2023-01-01', 'op3')"))
    await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.delete("/launches/99")
        assert response.status_code == 204
    
    result = await db_session.execute(text("SELECT COUNT(*) FROM launches WHERE launch_id = 99"))
    assert result.scalar() == 0

@pytest.mark.asyncio
async def test_add_remark_success(db_session):
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn6')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (891, 'Winch 891', 'sqn6')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('op4', 'oid4', 'Op4', 'sqn6', 'operator')"))
    await db_session.execute(text("INSERT INTO launches (launch_id, squadron_id, winch_id, drum, launch_number, timestamp, operator_sn) VALUES (100, 'sqn6', 891, 'left', 1, '2023-01-01', 'op4')"))
    await db_session.commit()

    payload = {"launch_id": 100, "remark": "Test remark"}
    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches/remarks", json=payload)
        assert response.status_code == 200
    
    result = await db_session.execute(text("SELECT remarks FROM launches WHERE launch_id = 100"))
    assert result.scalar() == "Test remark"

@pytest.mark.asyncio
async def test_add_repair_success(db_session):
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn7')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (892, 'Winch 892', 'sqn7')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('op5', 'oid5', 'Op5', 'sqn7', 'operator')"))
    await db_session.execute(text("INSERT INTO launches (launch_id, squadron_id, winch_id, drum, launch_number, timestamp, operator_sn) VALUES (101, 'sqn7', 892, 'left', 1, '2023-01-01', 'op5')"))
    await db_session.commit()

    payload = {"launch_id": 101, "repair": "Fixed engine", "supervisor_id": "sup1"}
    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches/repairs", json=payload)
        assert response.status_code == 200
    
    result = await db_session.execute(text("SELECT remarks FROM launches WHERE launch_id = 101"))
    assert result.scalar() == "Repair: Fixed engine S_id: sup1"
