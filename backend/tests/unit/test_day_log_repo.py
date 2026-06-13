from datetime import date, datetime, timezone
import pytest
from sqlalchemy import select

from models.day_log import Day_Log
from repositories.day_log_repo import get_day_log_from_date, get_drum_values


def make_day_log(**overrides) -> Day_Log:
    defaults = dict(
        squadron_id="123 VGS",
        winch_id=1,
        type="sign_on",
        timestamp=datetime.now(timezone.utc),
        left_drum=123,
        right_drum=123,
        operator_id="12345678",
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
    today_log_2 = make_day_log(winch_id=1, timestamp=datetime(2026, 6, 6, 12, 30, 0), left_drum=200)
    other_day_log = make_day_log(winch_id=1, timestamp=datetime(2026, 6, 5, 18, 45, 0), right_drum=999)
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
async def test_get_drum_values_success(db_session):
    db_session.add_all(
        [
            make_day_log(
                winch_id=1,
                left_drum=100,
                right_drum=200,
                timestamp=datetime(2026, 6, 6, 9, 15, 0),
            ),
            make_day_log(
                winch_id=1,
                left_drum=123,
                right_drum=321,
                timestamp=datetime(2026, 6, 6, 10, 15, 0),
            ),
        ]
    )
    await db_session.commit()

    result = await get_drum_values(db_session, 1)
    left_drum, right_drum = result
    assert left_drum == 123
    assert right_drum == 321


@pytest.mark.asyncio
async def test_get_drum_values_ignores_other_winch_records(db_session):
    db_session.add_all(
        [
            make_day_log(
                winch_id=1,
                left_drum=400,
                right_drum=500,
                timestamp=datetime(2026, 6, 6, 11, 15, 0),
            ),
            make_day_log(
                winch_id=2,
                left_drum=999,
                right_drum=888,
                timestamp=datetime(2026, 6, 6, 12, 15, 0),
            ),
        ]
    )
    await db_session.commit()

    result = await get_drum_values(db_session, 1)
    left_drum, right_drum = result
    assert left_drum == 400
    assert right_drum == 500


@pytest.mark.asyncio
async def test_get_drum_values_uses_latest_timestamp_not_insert_order(db_session):
    db_session.add_all(
        [
            make_day_log(
                winch_id=1,
                left_drum=250,
                right_drum=260,
                timestamp=datetime(2026, 6, 6, 13, 15, 0),
            ),
            make_day_log(
                winch_id=1,
                left_drum=150,
                right_drum=160,
                timestamp=datetime(2026, 6, 6, 8, 15, 0),
            ),
        ]
    )
    await db_session.commit()

    result = await get_drum_values(db_session, 1)
    left_drum, right_drum = result
    assert left_drum == 250
    assert right_drum == 260


@pytest.mark.asyncio
async def test_get_drum_values_returns_none_when_no_records_for_winch(db_session):
    db_session.add_all(
        [
            make_day_log(
                winch_id=2,
                left_drum=111,
                right_drum=222,
                timestamp=datetime(2026, 6, 6, 9, 15, 0),
            ),
        ]
    )
    await db_session.commit()

    result = await get_drum_values(db_session, 1)
    assert result is None




