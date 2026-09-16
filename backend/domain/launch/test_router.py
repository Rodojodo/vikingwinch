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
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            try:
                response = await ac.post("/launches", json=payload)
                assert response.status_code == 500
            except Exception:
                pass
    
    result = await db_session.execute(text("SELECT COUNT(*) FROM launches WHERE winch_id = 888"))
    assert result.scalar() == 0

