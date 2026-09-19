import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from unittest.mock import patch
from datetime import datetime, timezone
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


# ============================================================
# Tests for POST /launches/corrections
# ============================================================


@pytest.mark.asyncio
async def test_create_launch_correction_both_drums_success(db_session):
    now = datetime.now(timezone.utc).isoformat()
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn8')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (893, 'Winch 893', 'sqn8')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('op8', 'oid8', 'Op8', 'sqn8', 'operator')"))
    await db_session.execute(text(f"INSERT INTO day_log (id, squadron_id, winch_id, type, timestamp, operator_sn) VALUES (500, 'sqn8', 893, 'di', '{now}', 'op8')"))
    await db_session.commit()

    payload = {
        "winch_id": 893,
        "left": 50,
        "right": 80,
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches/corrections", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert len(data) == 2
        assert data[0]["drum"] == "left"
        assert data[0]["launch_number"] == 50
        assert data[0]["remarks"] == "corrected brought forward"
        assert data[0]["operator_sn"] == "op8"
        assert data[0]["squadron_id"] == "sqn8"

        assert data[1]["drum"] == "right"
        assert data[1]["launch_number"] == 80
        assert data[1]["remarks"] == "corrected brought forward"


@pytest.mark.asyncio
async def test_create_launch_correction_single_drum_left(db_session):
    now = datetime.now(timezone.utc).isoformat()
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn9')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (894, 'Winch 894', 'sqn9')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('op9', 'oid9', 'Op9', 'sqn9', 'operator')"))
    await db_session.execute(text(f"INSERT INTO day_log (id, squadron_id, winch_id, type, timestamp, operator_sn) VALUES (501, 'sqn9', 894, 'di', '{now}', 'op9')"))
    await db_session.commit()

    payload = {
        "winch_id": 894,
        "left": 12,
        "right": None,
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches/corrections", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert len(data) == 1
        assert data[0]["drum"] == "left"
        assert data[0]["launch_number"] == 12
        assert data[0]["remarks"] == "corrected brought forward"


@pytest.mark.asyncio
async def test_create_launch_correction_single_drum_right(db_session):
    now = datetime.now(timezone.utc).isoformat()
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn10')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (895, 'Winch 895', 'sqn10')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('op10', 'oid10', 'Op10', 'sqn10', 'operator')"))
    await db_session.execute(text(f"INSERT INTO day_log (id, squadron_id, winch_id, type, timestamp, operator_sn) VALUES (502, 'sqn10', 895, 'di', '{now}', 'op10')"))
    await db_session.commit()

    payload = {
        "winch_id": 895,
        "left": None,
        "right": 25,
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches/corrections", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert len(data) == 1
        assert data[0]["drum"] == "right"
        assert data[0]["launch_number"] == 25
        assert data[0]["remarks"] == "corrected brought forward"


@pytest.mark.asyncio
async def test_create_launch_correction_both_drums_null(db_session):
    payload = {
        "winch_id": 895,
        "left": None,
        "right": None,
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches/corrections", json=payload)
        assert response.status_code == 422

    result = await db_session.execute(text("SELECT COUNT(*) FROM launches WHERE remarks = 'corrected brought forward'"))
    assert result.scalar() == 0


@pytest.mark.asyncio
async def test_create_launch_correction_negative_value(db_session):
    payload = {
        "winch_id": 895,
        "left": -5,
        "right": 10,
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches/corrections", json=payload)
        assert response.status_code == 422

    result = await db_session.execute(text("SELECT COUNT(*) FROM launches WHERE remarks = 'corrected brought forward'"))
    assert result.scalar() == 0


@pytest.mark.asyncio
async def test_create_launch_correction_invalid_winch_id(db_session):
    payload = {
        "winch_id": 0,
        "left": 10,
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches/corrections", json=payload)
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_launch_correction_exceeds_max_int(db_session):
    payload = {
        "winch_id": 1,
        "left": 2147483648,
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches/corrections", json=payload)
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_launch_correction_strips_whitespace(db_session):
    now = datetime.now(timezone.utc).isoformat()
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn_strip')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (898, 'Winch 898', 'sqn_strip')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('op_strip', 'oid_s', 'Op Strip', 'sqn_strip', 'operator')"))
    await db_session.execute(text(f"INSERT INTO day_log (id, squadron_id, winch_id, type, timestamp, operator_sn) VALUES (505, 'sqn_strip', 898, 'di', '{now}', 'op_strip')"))
    await db_session.commit()

    payload = {
        "winch_id": 898,
        "squadron_id": "   sqn_strip   ",
        "operator_sn": "   op_strip   ",
        "left": 5,
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches/corrections", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data[0]["squadron_id"] == "sqn_strip"
        assert data[0]["operator_sn"] == "op_strip"


@pytest.mark.asyncio
async def test_create_launch_correction_missing_di_today(db_session):
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn11')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (896, 'Winch 896', 'sqn11')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('op11', 'oid11', 'Op11', 'sqn11', 'operator')"))
    # Old DI from yesterday
    await db_session.execute(text("INSERT INTO day_log (id, squadron_id, winch_id, type, timestamp, operator_sn) VALUES (503, 'sqn11', 896, 'di', '2026-06-01T10:00:00', 'op11')"))
    await db_session.commit()

    payload = {
        "winch_id": 896,
        "left": 50,
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        response = await ac.post("/launches/corrections", json=payload)
        assert response.status_code == 400
        assert "Daily Inspection" in response.json()["detail"] or "DI" in response.json()["detail"]

    result = await db_session.execute(text("SELECT COUNT(*) FROM launches WHERE winch_id = 896"))
    assert result.scalar() == 0


@pytest.mark.asyncio
async def test_create_launch_correction_atomic_rollback(db_session):
    now = datetime.now(timezone.utc).isoformat()
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn12')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (897, 'Winch 897', 'sqn12')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('op12', 'oid12', 'Op12', 'sqn12', 'operator')"))
    await db_session.execute(text(f"INSERT INTO day_log (id, squadron_id, winch_id, type, timestamp, operator_sn) VALUES (504, 'sqn12', 897, 'di', '{now}', 'op12')"))
    await db_session.commit()

    payload = {
        "winch_id": 897,
        "left": 50,
        "right": 80,
    }

    call_count = 0
    from domain.launch import repository as launch_repo
    real_add_launch_correction = launch_repo.add_launch_correction

    async def side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 2:
            raise RuntimeError("Database error on right drum")
        return await real_add_launch_correction(*args, **kwargs)

    with patch('domain.launch.repository.add_launch_correction', side_effect=side_effect):
        async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
            response = await ac.post("/launches/corrections", json=payload)
            assert response.status_code == 500

    # Verify atomic rollback: both left and right drum inserts rolled back!
    result = await db_session.execute(text("SELECT COUNT(*) FROM launches WHERE winch_id = 897"))
    assert result.scalar() == 0


@pytest.mark.asyncio
async def test_create_launch_correction_same_day_bf_and_zero_day_launches(db_session):
    now = datetime.now(timezone.utc).isoformat()
    today_str = datetime.now(timezone.utc).date().isoformat()
    await db_session.execute(text("INSERT INTO squadrons (id) VALUES ('sqn13')"))
    await db_session.execute(text("INSERT INTO winches (id, registration, squadron_id) VALUES (899, 'Winch 899', 'sqn13')"))
    await db_session.execute(text("INSERT INTO operators (service_no, entra_oid, name, squadron_id, qualification_level) VALUES ('op13', 'oid13', 'Op13', 'sqn13', 'operator')"))
    await db_session.execute(text(f"INSERT INTO day_log (id, squadron_id, winch_id, type, timestamp, operator_sn) VALUES (506, 'sqn13', 899, 'di', '{now}', 'op13')"))
    await db_session.commit()

    payload = {
        "winch_id": 899,
        "left": 50,
        "right": 80,
    }

    async with AsyncClient(transport=ASGITransport(app=app, raise_app_exceptions=False), base_url="http://test") as ac:
        # 1. Post correction
        response = await ac.post("/launches/corrections", json=payload)
        assert response.status_code == 201

        # 2. Check bf_info for today reflects corrected numbers immediately
        bf_resp = await ac.get(f"/winch/899/bf_info?day={today_str}")
        assert bf_resp.status_code == 200
        assert bf_resp.json()["left"] == 50
        assert bf_resp.json()["right"] == 80
        await db_session.commit()

        # 3. Check day_data for today: launches is empty (no phantom launch on drum buttons!)
        day_resp = await ac.get(f"/winch/899/day_data?day={today_str}")
        assert day_resp.status_code == 200
        assert len(day_resp.json()["launches"]) == 0
        await db_session.commit()

        # 4. Create first real launch of the day
        launch_payload = {
            "squadron_id": "sqn13",
            "winch_id": 899,
            "operator_sn": "op13",
            "drum": "left",
            "is_burn": False,
        }
        l_resp = await ac.post("/launches", json=launch_payload)
        assert l_resp.status_code == 201
        assert l_resp.json()["launch_number"] == 51
        await db_session.commit()

        # 5. Check day_data now has exactly 1 launch
        day_resp2 = await ac.get(f"/winch/899/day_data?day={today_str}")
        assert len(day_resp2.json()["launches"]) == 1
        assert day_resp2.json()["launches"][0]["launch_number"] == 51
        await db_session.commit()

        # 6. Check export_data: brought_forward has 50/80, launches has only the 1 flight
        exp_resp = await ac.get(f"/winch/899/export_data?squadron_id=sqn13&day={today_str}")
        assert exp_resp.status_code == 200
        exp_data = exp_resp.json()
        assert exp_data["brought_forward"]["left"] == 50
        assert exp_data["brought_forward"]["right"] == 80
        assert len(exp_data["launches"]) == 1
        assert exp_data["launches"][0]["launch_number"] == 51
