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
        operator_id="12345678",
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
    operator_id = "12345678"
    drum: Literal["left", "right"] = "left"

    # Verify timestamp is recorded at time of creation
    before = datetime.now(timezone.utc)
    result = await add_launch(db_session, squadron_id, winch_id, operator_id, drum)
    after = datetime.now(timezone.utc)

    assert result.launch_number is not None
    assert result.squadron_id == squadron_id
    assert result.winch_id == winch_id
    assert result.operator_id == operator_id
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
        operator_id="87654321",
        drum="right",
    )

    assert result.launch_number is not None
    assert result.winch_id == 2
    assert result.operator_id == "87654321"
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

    new_launch = await add_remark_to_launch(
        db_session, winch_id=1, drum="left", remark="PLF"
    )

    assert new_launch.launch_number == launch.launch_number
    assert new_launch.winch_id == launch.winch_id
    assert new_launch.operator_id == launch.operator_id
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

    new_launch = await add_remark_to_launch(
        db_session, winch_id=1, drum="right", remark="PLF"
    )

    assert new_launch.launch_number == launch.launch_number
    assert new_launch.winch_id == launch.winch_id
    assert new_launch.operator_id == launch.operator_id
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

    new_launch = await add_remark_to_launch(
        db_session, winch_id=1, drum="left", remark="PLF"
    )

    newest_launch = await add_remark_to_launch(
        db_session, winch_id=1, drum="left", remark="Making weird sounds"
    )

    assert newest_launch.launch_number == launch.launch_number
    assert newest_launch.winch_id == launch.winch_id
    assert newest_launch.operator_id == launch.operator_id
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

    new_launch = await add_remark_to_launch(
        db_session, winch_id=1, drum="left", remark="PLF"
    )

    assert new_launch.launch_number == launch_2.launch_number
    assert new_launch.winch_id == launch_2.winch_id
    assert new_launch.operator_id == launch_2.operator_id
    assert new_launch.drum == launch_2.drum
    assert new_launch.remarks == "PLF"


@pytest.mark.asyncio
async def test_add_remark_to_launch_raises_no_launch(db_session):
    """Test that adding a remark to a non-existent drum raises an error."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=2, registration="EF 34 GH", squadron_id="123 VGS")
    launch = make_launch()
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    with pytest.raises(ValueError, match="No previous launch"):
        new_launch = await add_remark_to_launch(
            db_session, winch_id=1, drum="right", remark="PLF"
        )


@pytest.mark.asyncio
async def test_add_remark_to_launch_raises_no_launch_today(db_session):
    """Test that remarks cannot be added to launches from a previous day."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=2, registration="EF 34 GH", squadron_id="123 VGS")
    # Date is well in the past
    launch = make_launch(timestamp=datetime(2000, 6, 6, 9, 15, 0))
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    with pytest.raises(ValueError, match="No previous launch"):
        new_launch = await add_remark_to_launch(
            db_session, winch_id=1, drum="right", remark="PLF"
        )


@pytest.mark.asyncio
async def test_add_remark_to_launch_ignore_other_winches(db_session):
    """Test that remarks are drum-specific and won't match other winches."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=2, registration="EF 34 GH", squadron_id="123 VGS")
    # Date is well in the past
    launch = make_launch(timestamp=datetime(2000, 6, 6, 9, 15, 0))
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    with pytest.raises(ValueError, match="No previous launch"):
        new_launch = await add_remark_to_launch(
            db_session, winch_id=2, drum="right", remark="PLF"
        )







# ============================================================
# Tests for add_repair_to_launch functionality
# ============================================================


@pytest.mark.asyncio
async def test_add_repair_to_launch_left_success(db_session):
    """Test adding a repair to a launch on the left drum."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    launch = make_launch()
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    new_launch = await add_repair_to_launch(
        db_session, winch_id=1, drum="left", repair="Weak link", supervisor_id="87654321"
    )

    assert new_launch.launch_number == launch.launch_number
    assert new_launch.winch_id == launch.winch_id
    assert new_launch.operator_id == launch.operator_id
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

    new_launch = await add_repair_to_launch(
        db_session, winch_id=1, drum="right", repair="Weak link", supervisor_id="87654321"
    )

    assert new_launch.launch_number == launch.launch_number
    assert new_launch.winch_id == launch.winch_id
    assert new_launch.operator_id == launch.operator_id
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

    new_launch = await add_repair_to_launch(
        db_session, winch_id=1, drum="left", repair="Weak link", supervisor_id="87654321"
    )

    assert new_launch.launch_number == launch_2.launch_number
    assert new_launch.winch_id == launch_2.winch_id
    assert new_launch.operator_id == launch_2.operator_id
    assert new_launch.drum == launch_2.drum
    assert new_launch.remarks == "Repair: Weak link S_id: 87654321"


@pytest.mark.asyncio
async def test_add_repair_to_launch_raises_no_launch(db_session):
    """Test that adding a repair to a non-existent drum raises an error."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=2, registration="EF 34 GH", squadron_id="123 VGS")
    launch = make_launch()
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    with pytest.raises(ValueError, match="No previous launch"):
        new_launch = await add_repair_to_launch(
            db_session, winch_id=1, drum="right", repair="Weak link", supervisor_id="87654321"
        )


@pytest.mark.asyncio
async def test_add_repair_to_launch_raises_no_launch_today(db_session):
    """Test that repairs cannot be added to launches from a previous day."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=2, registration="EF 34 GH", squadron_id="123 VGS")
    # Date is well in the past
    launch = make_launch(timestamp=datetime(2000, 6, 6, 9, 15, 0))
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    with pytest.raises(ValueError, match="No previous launch"):
        new_launch = await add_repair_to_launch(
            db_session, winch_id=1, drum="right", repair="Weak link", supervisor_id="87654321"
        )


@pytest.mark.asyncio
async def test_add_repair_to_launch_ignore_other_winches(db_session):
    """Test that repairs are winch-specific and won't match other winches."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=2, registration="EF 34 GH", squadron_id="123 VGS")
    # Date is well in the past
    launch = make_launch(timestamp=datetime(2000, 6, 6, 9, 15, 0))
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    with pytest.raises(ValueError, match="No previous launch"):
        new_launch = await add_repair_to_launch(
            db_session, winch_id=2, drum="right", repair="Weak link", supervisor_id="87654321"
        )


@pytest.mark.asyncio
async def test_add_repair_to_launch_no_supervisor(db_session):
    """Test that repairs work correctly without a supervisor."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=2, registration="EF 34 GH", squadron_id="123 VGS")
    # Date is well in the past
    launch = make_launch(timestamp=datetime(2000, 6, 6, 9, 15, 0))
    db_session.add_all([squadron, winch, launch])
    await db_session.commit()

    with pytest.raises(ValueError, match="No previous launch"):
        new_launch = await add_repair_to_launch(
            db_session, winch_id=2, drum="right", repair="Weak link", supervisor_id="87654321"
        )

# ============================================================
# Tests for get_launches_from_date functionality
# ============================================================


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

