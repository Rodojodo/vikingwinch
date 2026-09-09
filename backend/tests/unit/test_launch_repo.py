from datetime import date, datetime, timezone
from typing import Literal

import pytest

from models.launch import Launch
from models.operator import Operator
from models.squadron import Squadron
from models.winch import Winch
from repositories.launch_repo import (
    add_launch,
    get_launches_from_date,
    add_remark_to_launch,
    add_repair_to_launch,
)


# Helper function to create test Launch objects with sensible defaults
def make_launch(**overrides) -> Launch:
    defaults = dict(
        squadron_id="123 VGS",
        winch_id=1,
        drum="left",
        timestamp=datetime(2026, 6, 6, 9, 15, 0),
        operator_sn="12345678",
        remarks=None,
    )
    return Launch(**{**defaults, **overrides})


# ============================================================
# Tests for add_launch functionality
# ============================================================


@pytest.mark.asyncio
async def test_add_launch_success(db_session):
    """Test adding a launch with the left drum."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="AB 12 CD", squadron_id="123 VGS")

    db_session.add_all([squadron, winch])
    await db_session.commit()

    squadron_id = "123 VGS"
    winch_id = 1
    operator_sn = "12345678"
    drum: Literal["left", "right"] = "left"

    # Verify timestamp is recorded at time of creation
    before = datetime.now(timezone.utc)
    result = await add_launch(db_session, squadron_id, winch_id, operator_sn, drum)
    after = datetime.now(timezone.utc)

    assert result.launch_number is not None
    assert result.squadron_id == squadron_id
    assert result.winch_id == winch_id
    assert result.operator_sn == operator_sn
    assert result.drum == drum
    assert result.remarks is None
    assert before <= result.timestamp <= after


@pytest.mark.asyncio
async def test_add_launch_success_with_right_drum(db_session):
    """Test adding a launch with the right drum."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=2, registration="EF 34 GH", squadron_id="123 VGS")
    db_session.add_all([squadron, winch])
    await db_session.commit()

    result = await add_launch(
        db_session,
        squadron_id="123 VGS",
        winch_id=2,
        operator_sn="87654321",
        drum="right",
    )

    assert result.launch_number is not None
    assert result.winch_id == 2
    assert result.operator_sn == "87654321"
    assert result.drum == "right"


# ============================================================
# Tests for add_remark_to_launch functionality
# ============================================================


@pytest.mark.asyncio
async def test_add_remark_to_launch_left_success(db_session):
    """Test adding a remark to a launch on the left drum."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    launch = make_launch()
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    new_launch = await add_remark_to_launch(db_session, launch_id=launch_2.launch_id if 'launch_2' in locals() else launch.launch_id if 'launch' in locals() else 999 if "launch" in locals() else 999, remark="PLF")

    assert new_launch.launch_number == launch.launch_number
    assert new_launch.winch_id == launch.winch_id
    assert new_launch.operator_sn == launch.operator_sn
    assert new_launch.drum == launch.drum
    assert new_launch.remarks == "PLF"


@pytest.mark.asyncio
async def test_add_remark_to_launch_right_success(db_session):
    """Test adding a remark to a launch on the right drum."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    launch = make_launch(drum="right")
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    new_launch = await add_remark_to_launch(db_session, launch_id=launch_2.launch_id if 'launch_2' in locals() else launch.launch_id if 'launch' in locals() else 999 if "launch" in locals() else 999, remark="PLF")

    assert new_launch.launch_number == launch.launch_number
    assert new_launch.winch_id == launch.winch_id
    assert new_launch.operator_sn == launch.operator_sn
    assert new_launch.drum == launch.drum
    assert new_launch.remarks == "PLF"


@pytest.mark.asyncio
async def test_add_remark_to_launch_add_2_remarks_success(db_session):
    """Test that multiple remarks are concatenated together."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=2, registration="EF 34 GH", squadron_id="123 VGS")
    launch = make_launch()
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    new_launch = await add_remark_to_launch(db_session, launch_id=launch_2.launch_id if 'launch_2' in locals() else launch.launch_id if 'launch' in locals() else 999 if "launch" in locals() else 999, remark="PLF")

    newest_launch = await add_remark_to_launch(db_session, launch_id=launch_2.launch_id if 'launch_2' in locals() else launch.launch_id if 'launch' in locals() else 999 if "launch" in locals() else 999, remark="Making weird sounds")

    assert newest_launch.launch_number == launch.launch_number
    assert newest_launch.winch_id == launch.winch_id
    assert newest_launch.operator_sn == launch.operator_sn
    assert newest_launch.drum == launch.drum
    assert newest_launch.remarks == "PLF, Making weird sounds"


@pytest.mark.asyncio
async def test_add_remark_to_launch_ignore_previous_launches(db_session):
    """Test that remarks are added to the most recent launch only."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=2, registration="EF 34 GH", squadron_id="123 VGS")
    launch_1 = make_launch()
    launch_2 = make_launch(timestamp=datetime(2026, 6, 6, 9, 30, 0))
    db_session.add_all([squadron, winch, launch_1, launch_2])
    await db_session.commit()

    new_launch = await add_remark_to_launch(db_session, launch_id=launch_2.launch_id if 'launch_2' in locals() else launch.launch_id if 'launch' in locals() else 999 if "launch" in locals() else 999, remark="PLF")

    assert new_launch.launch_number == launch_2.launch_number
    assert new_launch.winch_id == launch_2.winch_id
    assert new_launch.operator_sn == launch_2.operator_sn
    assert new_launch.drum == launch_2.drum
    assert new_launch.remarks == "PLF"


@pytest.mark.asyncio
async def test_add_repair_to_launch_left_success(db_session):
    """Test adding a repair to a launch on the left drum."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    launch = make_launch()
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    new_launch = await add_repair_to_launch(db_session, launch_id=launch_2.launch_id if 'launch_2' in locals() else launch.launch_id if 'launch' in locals() else 999 if "launch" in locals() else 999, repair="Weak link", supervisor_id="87654321")

    assert new_launch.launch_number == launch.launch_number
    assert new_launch.winch_id == launch.winch_id
    assert new_launch.operator_sn == launch.operator_sn
    assert new_launch.drum == launch.drum
    assert new_launch.remarks == "Repair: Weak link S_id: 87654321"


@pytest.mark.asyncio
async def test_add_repair_to_launch_right_success(db_session):
    """Test adding a repair to a launch on the right drum."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    launch = make_launch(drum="right")
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    new_launch = await add_repair_to_launch(db_session, launch_id=launch_2.launch_id if 'launch_2' in locals() else launch.launch_id if 'launch' in locals() else 999 if "launch" in locals() else 999, repair="Weak link", supervisor_id="87654321")

    assert new_launch.launch_number == launch.launch_number
    assert new_launch.winch_id == launch.winch_id
    assert new_launch.operator_sn == launch.operator_sn
    assert new_launch.drum == launch.drum
    assert new_launch.remarks == "Repair: Weak link S_id: 87654321"


@pytest.mark.asyncio
async def test_add_repair_to_launch_ignore_previous_launches(db_session):
    """Test that repairs are added to the most recent launch only."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    launch_1 = make_launch()
    launch_2 = make_launch(timestamp=datetime(2026, 6, 6, 9, 30, 0))
    db_session.add_all([squadron, winch, launch_1, launch_2])
    await db_session.commit()

    new_launch = await add_repair_to_launch(db_session, launch_id=launch_2.launch_id if 'launch_2' in locals() else launch.launch_id if 'launch' in locals() else 999 if "launch" in locals() else 999, repair="Weak link", supervisor_id="87654321")

    assert new_launch.launch_number == launch_2.launch_number
    assert new_launch.winch_id == launch_2.winch_id
    assert new_launch.operator_sn == launch_2.operator_sn
    assert new_launch.drum == launch_2.drum
    assert new_launch.remarks == "Repair: Weak link S_id: 87654321"


@pytest.mark.asyncio
async def test_get_launches_from_date_success(db_session):
    """Test retrieving launches from a specific date and winch."""
    db_session.add_all(
        [
            make_launch(timestamp=datetime(2026, 6, 6, 8, 0, 0)),
            make_launch(timestamp=datetime(2026, 6, 6, 12, 30, 0), drum="right"),
            make_launch(timestamp=datetime(2026, 6, 5, 23, 59, 59)),  # Previous day
            make_launch(winch_id=2, timestamp=datetime(2026, 6, 6, 10, 0, 0)),  # Different winch
        ]
    )
    await db_session.commit()

    result = await get_launches_from_date(db_session, 1, date(2026, 6, 6))

    # Verify we only get launches for the specified date and winch
    assert len(result) == 2
    assert all(launch.winch_id == 1 for launch in result)
    assert all(launch.timestamp.date() == date(2026, 6, 6) for launch in result)
    assert {launch.timestamp.hour for launch in result} == {8, 12}


@pytest.mark.asyncio
async def test_get_launches_from_date_returns_empty_list_when_no_matches(db_session):
    """Test that an empty list is returned when no launches match the criteria."""
    db_session.add_all(
        [
            make_launch(timestamp=datetime(2026, 6, 5, 8, 0, 0)),
            make_launch(winch_id=2, timestamp=datetime(2026, 6, 6, 8, 0, 0)),
        ]
    )
    await db_session.commit()

    result = await get_launches_from_date(db_session, 1, date(2026, 6, 6))

    assert result == []


@pytest.mark.asyncio
async def test_add_launch_burn(db_session):
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    db_session.add_all([squadron, winch])
    await db_session.commit()
    
    launch1 = await add_launch(db_session, squadron_id="123 VGS", winch_id=1, operator_sn="OFF-1002", drum="left", is_burn=False)
    launch2 = await add_launch(db_session, squadron_id="123 VGS", winch_id=1, operator_sn="OFF-1002", drum="left", is_burn=True)
    launch3 = await add_launch(db_session, squadron_id="123 VGS", winch_id=1, operator_sn="OFF-1002", drum="left", is_burn=True)
    launch4 = await add_launch(db_session, squadron_id="123 VGS", winch_id=1, operator_sn="OFF-1002", drum="left", is_burn=False)
    
    assert launch1.launch_number == 1
    assert launch2.launch_number is None
    assert launch3.launch_number is None
    assert launch4.launch_number == 2


@pytest.mark.asyncio
async def test_delete_launch_success(db_session):
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    launch = make_launch()
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()
    
    from repositories.launch_repo import delete_launch
    deleted = await delete_launch(db_session, launch.launch_id)
    assert deleted is not None
    assert deleted.launch_id == launch.launch_id
    
    # Check it's gone
    from sqlalchemy import select
    from models.launch import Launch
    stmt = select(Launch).where(Launch.launch_id == launch.launch_id)
    res = await db_session.execute(stmt)
    assert res.scalars().first() is None


@pytest.mark.asyncio
async def test_get_brought_forward(db_session):
    """Test retrieving brought forward values for a winch."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    
    from repositories.launch_repo import get_brought_forward
    db_session.add_all([squadron, winch])
    
    # Add historical launches for previous days
    db_session.add_all(
        [
            make_launch(launch_number=10, timestamp=datetime(2026, 6, 4, 8, 0, 0), drum="left"),
            make_launch(launch_number=11, timestamp=datetime(2026, 6, 5, 8, 0, 0), drum="left"),
            make_launch(launch_number=None, timestamp=datetime(2026, 6, 5, 9, 0, 0), drum="left"), # burn
            make_launch(launch_number=5, timestamp=datetime(2026, 6, 4, 12, 30, 0), drum="right"),
            make_launch(winch_id=2, launch_number=100, timestamp=datetime(2026, 6, 5, 10, 0, 0), drum="left"),  # Different winch
        ]
    )
    await db_session.commit()

    # Get brought forward for current day (2026, 6, 6)
    result = await get_brought_forward(db_session, 1, date(2026, 6, 6))

    # Expect last valid left is 11, right is 5
    assert result == {"left": 11, "right": 5}
