import pytest
from datetime import date, datetime, timezone
from domain.launch.model import Launch
from domain.launch.repository import (
    add_launch,
    add_launch_correction,
    get_launches_from_date,
    get_brought_forward,
    add_remark_to_launch,
    add_repair_to_launch,
    delete_launch,
)
from domain.squadron.model import Squadron
from domain.winch.model import Winch
from domain.operator.model import Operator
from typing import Literal


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

    new_launch = await add_remark_to_launch(db_session, launch_id=launch.launch_id, remark="PLF")

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

    new_launch = await add_remark_to_launch(db_session, launch_id=launch.launch_id, remark="PLF")

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

    await add_remark_to_launch(db_session, launch_id=launch.launch_id, remark="PLF")

    newest_launch = await add_remark_to_launch(db_session, launch_id=launch.launch_id, remark="Making weird sounds")

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

    new_launch = await add_remark_to_launch(db_session, launch_id=launch_2.launch_id, remark="PLF")

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

    new_launch = await add_repair_to_launch(db_session, launch_id=launch.launch_id, repair="Weak link", supervisor_id="87654321")

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

    new_launch = await add_repair_to_launch(db_session, launch_id=launch.launch_id, repair="Weak link", supervisor_id="87654321")

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

    new_launch = await add_repair_to_launch(db_session, launch_id=launch_2.launch_id, repair="Weak link", supervisor_id="87654321")

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
async def test_get_launches_from_date_orders_by_launch_id_asc(db_session):
    """Test that get_launches_from_date orders records by launch_id ASC."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    operator = Operator(service_no="12345678", entra_oid="oid1", name="Op", squadron_id="123 VGS", qualification_level="operator")
    db_session.add_all([squadron, winch, operator])
    await db_session.commit()

    l1 = make_launch(launch_number=100, timestamp=datetime(2026, 6, 6, 9, 0, 0))
    l2 = make_launch(launch_number=20, timestamp=datetime(2026, 6, 6, 9, 30, 0), remarks="corrected brought forward")
    l3 = make_launch(launch_number=21, timestamp=datetime(2026, 6, 6, 10, 0, 0))
    db_session.add_all([l1, l2, l3])
    await db_session.commit()

    results = await get_launches_from_date(db_session, 1, date(2026, 6, 6))
    assert len(results) == 3
    assert [r.launch_id for r in results] == sorted([r.launch_id for r in results])
    assert results[1].remarks == "corrected brought forward"
    assert results[1].launch_number == 20


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
    
    deleted = await delete_launch(db_session, launch.launch_id)
    assert deleted is not None
    assert deleted.launch_id == launch.launch_id
    
    # Check it's gone
    from sqlalchemy import select
    from domain.launch.model import Launch
    stmt = select(Launch).where(Launch.launch_id == launch.launch_id)
    res = await db_session.execute(stmt)
    assert res.scalars().first() is None


@pytest.mark.asyncio
async def test_get_brought_forward(db_session):
    """Test retrieving brought forward values for a winch."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
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


@pytest.mark.asyncio
async def test_add_launch_correction_success(db_session):
    """Test add_launch_correction creates a Launch with 'corrected brought forward' remark."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    operator = Operator(service_no="12345678", entra_oid="oid1", name="Op", squadron_id="123 VGS", qualification_level="operator")
    db_session.add_all([squadron, winch, operator])
    await db_session.commit()

    correction = await add_launch_correction(
        db_session,
        squadron_id="123 VGS",
        winch_id=1,
        operator_sn="12345678",
        drum="left",
        launch_num=40,
    )
    assert correction.launch_id is not None
    assert correction.launch_number == 40
    assert correction.drum == "left"
    assert correction.remarks == "corrected brought forward"
    assert correction.operator_sn == "12345678"
    assert correction.winch_id == 1


@pytest.mark.asyncio
async def test_downward_correction_effect(db_session):
    """Given existing launch 100, when correction is set to 20, subsequent add_launch produces 21."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    operator = Operator(service_no="12345678", entra_oid="oid1", name="Op", squadron_id="123 VGS", qualification_level="operator")
    db_session.add_all([squadron, winch, operator])
    await db_session.commit()

    # Existing launch 100
    l1 = make_launch(launch_number=100, drum="left")
    db_session.add(l1)
    await db_session.commit()

    # Downward correction sets left = 20
    await add_launch_correction(
        db_session,
        squadron_id="123 VGS",
        winch_id=1,
        operator_sn="12345678",
        drum="left",
        launch_num=20,
    )
    await db_session.commit()

    # Subsequent add_launch produces 21
    next_launch = await add_launch(
        db_session,
        squadron_id="123 VGS",
        winch_id=1,
        operator_sn="12345678",
        drum="left",
    )
    assert next_launch.launch_number == 21


@pytest.mark.asyncio
async def test_upward_correction_effect(db_session):
    """Given existing launch 100, when correction is set to 150, subsequent add_launch produces 151."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    operator = Operator(service_no="12345678", entra_oid="oid1", name="Op", squadron_id="123 VGS", qualification_level="operator")
    db_session.add_all([squadron, winch, operator])
    await db_session.commit()

    # Existing launch 100
    l1 = make_launch(launch_number=100, drum="left")
    db_session.add(l1)
    await db_session.commit()

    # Upward correction sets left = 150
    await add_launch_correction(
        db_session,
        squadron_id="123 VGS",
        winch_id=1,
        operator_sn="12345678",
        drum="left",
        launch_num=150,
    )
    await db_session.commit()

    # Subsequent add_launch produces 151
    next_launch = await add_launch(
        db_session,
        squadron_id="123 VGS",
        winch_id=1,
        operator_sn="12345678",
        drum="left",
    )
    assert next_launch.launch_number == 151


@pytest.mark.asyncio
async def test_next_day_brought_forward_with_correction(db_session):
    """Test get_brought_forward reflects the latest correction before current_day."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    operator = Operator(service_no="12345678", entra_oid="oid1", name="Op", squadron_id="123 VGS", qualification_level="operator")
    db_session.add_all([squadron, winch, operator])

    # Day 1: normal launch 10, then downward correction to 5
    l1 = make_launch(launch_number=10, timestamp=datetime(2026, 6, 5, 9, 0, 0), drum="left")
    c1 = make_launch(
        launch_number=5,
        timestamp=datetime(2026, 6, 5, 10, 0, 0),
        drum="left",
        remarks="corrected brought forward",
    )
    db_session.add_all([l1, c1])
    await db_session.commit()

    bf = await get_brought_forward(db_session, 1, date(2026, 6, 6))
    assert bf["left"] == 5
    assert bf["right"] is None


@pytest.mark.asyncio
async def test_sequential_add_launches_monotonically_increasing(db_session):
    """Test multiple add_launch calls allocate distinct, monotonically increasing numbers."""
    squadron = Squadron(id="123 VGS")
    winch = Winch(id=1, registration="EF 34 GH", squadron_id="123 VGS")
    operator = Operator(service_no="12345678", entra_oid="oid1", name="Op", squadron_id="123 VGS", qualification_level="operator")
    db_session.add_all([squadron, winch, operator])
    await db_session.commit()

    launches = []
    for _ in range(5):
        launch_entry = await add_launch(db_session, "123 VGS", 1, "12345678", "left")
        launches.append(launch_entry)

    assert [entry.launch_number for entry in launches] == [1, 2, 3, 4, 5]
