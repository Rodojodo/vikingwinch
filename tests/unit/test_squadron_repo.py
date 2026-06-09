import pytest
from repositories.squadron_repo import squadron_exists
from models.squadron import Squadron



@pytest.mark.asyncio
async def test_get_squadron_from_sn_hit(db_session):
    # Arrange: Seed test database
    mock_squadron = Squadron(
        id="123 VGS"
    )
    db_session.add(mock_squadron)
    await db_session.commit()
    # Act
    result = await squadron_exists(db_session, id="123 VGS")
    # Assert
    assert result



@pytest.mark.asyncio
async def test_get_squadron_from_sn_miss(db_session):
    result = await squadron_exists(db_session, id="123 VGS")
    assert not result
