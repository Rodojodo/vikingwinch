from datetime import datetime

import pytest
from sqlalchemy import func, select

from domain.day_log.model import Day_Log
from domain.launch.model import Launch
from domain.operator.model import Operator
from domain.reset.service import reset_testvgs
from domain.squadron.model import Squadron
from domain.winch.model import Winch


@pytest.mark.asyncio
async def test_reset_is_idempotent_with_hardcoded_test_state(db_session, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "preview")
    db_session.add_all(
        [
            Squadron(id="testvgs"),
            Operator(
                service_no="ADMIN-1",
                auth_subject="admin",
                name="Admin",
                squadron_id="testvgs",
                qualification_level="examiner",
            ),
            Winch(id=101, registration="First", squadron_id="testvgs"),
            Winch(id=102, registration="Second", squadron_id="testvgs"),
        ]
    )
    await db_session.commit()

    first_result = await reset_testvgs(db_session, "ADMIN-1")
    second_result = await reset_testvgs(db_session, "ADMIN-1")

    assert first_result == second_result
    logs = (await db_session.scalars(select(Day_Log).order_by(Day_Log.winch_id))).all()
    launches = (await db_session.scalars(select(Launch).order_by(Launch.winch_id, Launch.drum))).all()
    assert {log.winch_id: log.hours for log in logs} == {101: 315.6, 102: 285.1}
    assert all(log.type == "finish_day" for log in logs)
    assert all(log.timestamp.date() < datetime.now().date() for log in logs)
    assert len(launches) == 4
    assert {
        (launch.winch_id, launch.drum): launch.launch_number
        for launch in launches
    } == {
        (101, "left"): 3156,
        (101, "right"): 3142,
        (102, "left"): 3156,
        (102, "right"): 3142,
    }
    assert await db_session.scalar(select(func.count()).select_from(Day_Log)) == 2
    assert await db_session.scalar(select(func.count()).select_from(Launch)) == 4


@pytest.mark.asyncio
async def test_reset_is_unavailable_in_production(db_session, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")

    with pytest.raises(PermissionError, match="unavailable in production"):
        await reset_testvgs(db_session, "ADMIN-1")


@pytest.mark.asyncio
async def test_reset_is_unavailable_without_environment(db_session, monkeypatch):
    monkeypatch.delenv("ENVIRONMENT", raising=False)

    with pytest.raises(PermissionError, match="unavailable in production"):
        await reset_testvgs(db_session, "ADMIN-1")
