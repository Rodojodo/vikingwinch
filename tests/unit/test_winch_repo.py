import pytest

from models.squadron import Squadron
from repositories.winch_repo import get_winch_from_id, get_winches_from_sqn
from models.winch import Winch



@pytest.mark.asyncio
async def test_get_winch_from_id_success(db_session):
    # Arrange: Seed test database
    mock_winch = Winch(
        id=17,
        registration="AB 12 CD",
        squadron_id="123 VGS"
    )
    db_session.add(mock_winch)
    await db_session.commit()

    # Act
    result = await get_winch_from_id(db_session, id=17)

    # Assert
    assert result is not None
    assert result.registration == "AB 12 CD"

@pytest.mark.asyncio
async def test_get_winch_from_id_miss(db_session):
    with pytest.raises(ValueError):
        await get_winch_from_id(db_session, id=17)



@pytest.mark.asyncio
async def test_get_winches_from_sqn_pass(db_session):
    mock_winch_1 = Winch(
        id=17,
        registration="AB 12 CD",
        squadron_id="123 VGS"
    )
    mock_winch_2 = Winch(
        id=22,
        registration="EF 34 GH",
        squadron_id="123 VGS"
    )
    db_session.add_all([mock_winch_1, mock_winch_2, Squadron(id="123 VGS")])
    await db_session.commit()

    # Act
    result = await get_winches_from_sqn(db_session, squadron="123 VGS")

    assert len(result) == 2
    assert any(op.id == 17 for op in result)
    assert any(op.id == 22 for op in result)

@pytest.mark.asyncio
async def test_get_winches_from_sqn_no_squadron(db_session):
    mock_winch_1 = Winch(
        id=17,
        registration="AB 12 CD",
        squadron_id="123 VGS"
    )
    mock_winch_2 = Winch(
        id="22",
        registration="EF 34 GH",
        squadron_id="123 VGS"
    )
    db_session.add_all([mock_winch_1, mock_winch_2])
    await db_session.commit()

    # Act
    with pytest.raises(ValueError, match="Squadron not found"):
        await get_winches_from_sqn(db_session, squadron="123 VGS")


@pytest.mark.asyncio
async def test_get_winches_from_sqn_no_winches(db_session):
    db_session.add(Squadron(id="123 VGS"))
    await db_session.commit()

    with pytest.raises(ValueError, match="Winches not found"):
        await get_winches_from_sqn(db_session, squadron="123 VGS")

@pytest.mark.asyncio
async def test_get_winches_from_sqn_no_squadron_no_winches(db_session):
    with pytest.raises(ValueError, match="Squadron not found"):
        await get_winches_from_sqn(db_session, squadron="123 VGS")