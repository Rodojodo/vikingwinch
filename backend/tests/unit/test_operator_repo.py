import pytest

from models.squadron import Squadron
from repositories.operator_repo import get_operator_from_sn, get_operators_from_sqn
from models.operator import Operator



@pytest.mark.asyncio
async def test_get_operator_from_sn_success(db_session):
    # Arrange: Seed test database
    mock_operator = Operator(
        service_no="12345678",
        entra_oid="a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        name="Joe Bloggs",
        squadron_id="123 VGS",
        qualification_level="instructor"
    )
    db_session.add(mock_operator)
    await db_session.commit()

    # Act
    result = await get_operator_from_sn(db_session, service_no="12345678")

    # Assert
    assert result is not None
    assert result.name == "Joe Bloggs"

@pytest.mark.asyncio
async def test_get_operator_from_sn_miss(db_session):
    with pytest.raises(ValueError):
        await get_operator_from_sn(db_session, service_no="12345678")



@pytest.mark.asyncio
async def test_get_operators_from_sqn_pass(db_session):
    mock_operator_1 = Operator(
        service_no="12345678",
        entra_oid="0946-n8wny3-yn89",
        name="Joe Bloggs",
        squadron_id="123 VGS",
        qualification_level="instructor"
    )
    mock_operator_2 = Operator(
        service_no="87654321",
        entra_oid="gsbu-ibgseh-uiseg",
        name="Rosie Smith",
        squadron_id="123 VGS",
        qualification_level="instructor"
    )
    db_session.add_all([mock_operator_1, mock_operator_2, Squadron(id="123 VGS")])
    await db_session.commit()

    # Act
    result = await get_operators_from_sqn(db_session, squadron="123 VGS")

    assert len(result) == 2
    assert any(op.service_no == "12345678" for op in result)
    assert any(op.service_no == "87654321" for op in result)

@pytest.mark.asyncio
async def test_get_operators_from_sqn_no_squadron(db_session):
    mock_operator_1 = Operator(
        service_no="12345678",
        entra_oid="0946-n8wny3-yn89",
        name="Joe Bloggs",
        squadron_id="123 VGS",
        qualification_level="instructor"
    )
    mock_operator_2 = Operator(
        service_no="87654321",
        entra_oid="gsbu-ibgseh-uiseg",
        name="Rosie Smith",
        squadron_id="123 VGS",
        qualification_level="instructor"
    )
    db_session.add_all([mock_operator_1, mock_operator_2])
    await db_session.commit()

    # Act
    with pytest.raises(ValueError, match="Squadron not found"):
        await get_operators_from_sqn(db_session, squadron="123 VGS")


@pytest.mark.asyncio
async def test_get_operators_from_sqn_no_operators(db_session):
    db_session.add(Squadron(id="123 VGS"))
    await db_session.commit()

    with pytest.raises(ValueError, match="Operators not found"):
        await get_operators_from_sqn(db_session, squadron="123 VGS")

@pytest.mark.asyncio
async def test_get_operators_from_sqn_no_squadron_no_operators(db_session):
    with pytest.raises(ValueError, match="Squadron not found"):
        await get_operators_from_sqn(db_session, squadron="123 VGS")