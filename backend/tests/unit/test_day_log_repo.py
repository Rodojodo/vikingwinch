from datetime import date, datetime, timezone
import pytest
from sqlalchemy import select

from models.day_log import Day_Log
from repositories.day_log_repo import get_day_log_from_date


def make_day_log(**overrides) -> Day_Log:
    defaults = dict(
        squadron_id="123 VGS",
        winch_id=1,
        type="sign_on",
        timestamp=datetime.now(timezone.utc),
        operator_sn="12345678",
        trainee=None,
        cable_check="12345678",
        hours=100.5
    )
    return Day_Log(**{**defaults, **overrides})


@pytest.mark.asyncio
async def test_get_day_log_from_date_success(db_session):
    # Arrange: Seed test database
    mock_log_1 = make_day_log(winch_id=1, timestamp=datetime(2026, 6, 6, 9, 15, 0))
    mock_log_2 = make_day_log(winch_id=1, timestamp=datetime(2026, 6, 6, 9, 16, 0))
    mock_log_3 = make_day_log(winch_id=1, timestamp=datetime(2026, 6, 6, 9, 17, 0))
    db_session.add_all([mock_log_1, mock_log_2, mock_log_3])
    await db_session.commit()

    # Act
    result = await get_day_log_from_date(db_session, 1, date(2026, 6, 6))

    # Assert
    assert len(result) == 3
    assert result[0].squadron_id == "123 VGS"


@pytest.mark.asyncio
async def test_get_day_log_from_date_filters_out_other_dates(db_session):
    today_log_1 = make_day_log(winch_id=1, timestamp=datetime(2026, 6, 6, 9, 15, 0))
    today_log_2 = make_day_log(winch_id=1, timestamp=datetime(2026, 6, 6, 12, 30, 0))
    other_day_log = make_day_log(winch_id=1, timestamp=datetime(2026, 6, 5, 18, 45, 0))
    db_session.add_all([today_log_1, other_day_log, today_log_2])
    await db_session.commit()

    result = await get_day_log_from_date(db_session, 1, date(2026, 6, 6))

    assert len(result) == 2
    assert all(log.timestamp.date() == date(2026, 6, 6) for log in result)
    assert {log.timestamp.hour for log in result} == {9, 12}


@pytest.mark.asyncio
async def test_get_day_log_from_date_returns_empty_list_when_no_matches(db_session):
    db_session.add_all(
        [
            make_day_log(winch_id=1, timestamp=datetime(2026, 6, 5, 9, 15, 0)),
            make_day_log(winch_id=1, timestamp=datetime(2026, 6, 7, 9, 15, 0)),
        ]
    )
    await db_session.commit()

    result = await get_day_log_from_date(db_session, 1, date(2026, 6, 6))

    assert result == []


@pytest.mark.asyncio
async def test_get_day_log_from_date_filters_out_other_winches(db_session):
    winch_1_log_1 = make_day_log(winch_id=1, timestamp=datetime(2026, 6, 6, 9, 15, 0))
    winch_1_log_2 = make_day_log(winch_id=1, timestamp=datetime(2026, 6, 6, 10, 30, 0))
    winch_2_log = make_day_log(winch_id=2, timestamp=datetime(2026, 6, 6, 9, 45, 0))
    db_session.add_all([winch_1_log_1, winch_2_log, winch_1_log_2])
    await db_session.commit()

    result = await get_day_log_from_date(db_session, 1, date(2026, 6, 6))

    assert len(result) == 2
    assert all(log.winch_id == 1 for log in result)
    assert {log.timestamp.hour for log in result} == {9, 10}


@pytest.mark.asyncio
async def test_get_winch_hours_success(db_session):
    from repositories.day_log_repo import get_winch_hours
    db_session.add_all([
        make_day_log(winch_id=1, hours=100.0, timestamp=datetime(2026, 6, 6, 9, 15, 0)),
        make_day_log(winch_id=1, hours=105.5, timestamp=datetime(2026, 6, 6, 10, 15, 0)),
    ])
    await db_session.commit()
    result = await get_winch_hours(db_session, 1)
    assert result == 105.5

@pytest.mark.asyncio
async def test_get_winch_hours_returns_none_when_no_records(db_session):
    from repositories.day_log_repo import get_winch_hours
    db_session.add_all([
        make_day_log(winch_id=2, hours=111.1, timestamp=datetime(2026, 6, 6, 9, 15, 0)),
    ])
    await db_session.commit()
    result = await get_winch_hours(db_session, 1)
    assert result is None

@pytest.mark.asyncio
async def test_add_day_log_success(db_session):
    from repositories.day_log_repo import add_day_log
    from core.schemas import DayLogCreate
    
    
    
    await db_session.commit()

    payload = DayLogCreate(
        squadron_id="123 VGS",
        type="sign_on",
        operator_sn="OFF-1002",
        cable_check="SGT-2005",
        hours=10.5
    )

    log = await add_day_log(db_session, 1, payload)
    assert log.id is not None
    assert log.winch_id == 1
    assert log.hours == 10.5
