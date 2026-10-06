from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from domain.operator.identity import GraphOperator, resolve_operator
from domain.operator.model import Operator
from domain.squadron.model import Squadron


@pytest.mark.asyncio
async def test_clerk_subject_requires_explicit_operator_mapping(db_session):
    with pytest.raises(HTTPException) as error:
        await resolve_operator(db_session, "clerk", "clerk-user", None)

    assert error.value.status_code == 403


@pytest.mark.asyncio
async def test_clerk_subject_resolves_existing_operator(db_session):
    db_session.add(Squadron(id="123 VGS"))
    db_session.add(
        Operator(
            service_no="SGT-2005",
            auth_provider="clerk",
            auth_subject="clerk-user",
            name="David Miller",
            squadron_id="123 VGS",
            qualification_level="operator",
        )
    )
    await db_session.commit()

    operator = await resolve_operator(db_session, "clerk", "clerk-user", None)

    assert operator.service_no == "SGT-2005"
    assert operator.squadron_id == "123 VGS"


@pytest.mark.asyncio
async def test_msal_first_sign_in_provisions_from_graph(db_session, monkeypatch):
    db_session.add(Squadron(id="123 VGS"))
    await db_session.commit()
    monkeypatch.setattr(
        "domain.operator.identity._get_graph_operator",
        AsyncMock(return_value=_graph_operator()),
    )

    operator = await resolve_operator(db_session, "msal", "entra-user", "tenant")

    assert operator.service_no == "SGT-2005"
    assert operator.auth_provider == "msal"
    assert operator.auth_subject == "entra-user"
    assert operator.auth_tenant_id == "tenant"
    assert operator.qualification_level == "operator"


@pytest.mark.asyncio
async def test_msal_sign_in_updates_existing_projection(db_session, monkeypatch):
    db_session.add(Squadron(id="123 VGS"))
    db_session.add(
        Operator(
            service_no="SGT-2005",
            auth_provider="msal",
            auth_subject="entra-user",
            auth_tenant_id="tenant",
            name="Old Name",
            squadron_id="123 VGS",
            qualification_level="operator",
        )
    )
    await db_session.commit()
    monkeypatch.setattr(
        "domain.operator.identity._get_graph_operator",
        AsyncMock(return_value=GraphOperator(
            service_no="SGT-2005",
            name="Updated Name",
            squadron_id="123 VGS",
        )),
    )

    operator = await resolve_operator(db_session, "msal", "entra-user", "tenant")

    assert operator.name == "Updated Name"
    assert (await db_session.scalar(select(Operator).where(Operator.service_no == "SGT-2005"))).name == "Updated Name"


@pytest.mark.asyncio
async def test_msal_rejects_unknown_squadron(db_session, monkeypatch):
    monkeypatch.setattr(
        "domain.operator.identity._get_graph_operator",
        AsyncMock(return_value=GraphOperator(
            service_no="SGT-2005",
            name="David Miller",
            squadron_id="999 VGS",
        )),
    )

    with pytest.raises(HTTPException) as error:
        await resolve_operator(db_session, "msal", "entra-user", "tenant")

    assert error.value.status_code == 403


@pytest.mark.asyncio
async def test_msal_rejects_service_number_identity_collision(db_session, monkeypatch):
    db_session.add(Squadron(id="123 VGS"))
    db_session.add(
        Operator(
            service_no="SGT-2005",
            auth_provider="clerk",
            auth_subject="clerk-user",
            name="David Miller",
            squadron_id="123 VGS",
            qualification_level="operator",
        )
    )
    await db_session.commit()
    monkeypatch.setattr(
        "domain.operator.identity._get_graph_operator",
        AsyncMock(return_value=GraphOperator(
            service_no="SGT-2005",
            name="David Miller",
            squadron_id="123 VGS",
        )),
    )

    with pytest.raises(HTTPException) as error:
        await resolve_operator(db_session, "msal", "entra-user", "tenant")

    assert error.value.status_code == 403


def _graph_operator() -> GraphOperator:
    return GraphOperator(
        service_no="SGT-2005",
        name="David Miller",
        squadron_id="123 VGS",
    )
