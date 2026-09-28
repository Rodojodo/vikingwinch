import pytest
from httpx import ASGITransport, AsyncClient

from auth import Principal, authorize_squadron
from main import app
from auth import get_current_principal


@pytest.mark.asyncio
async def test_database_backed_route_requires_bearer_token():
    app.dependency_overrides.pop(get_current_principal, None)
    async with AsyncClient(
        transport=ASGITransport(app=app, raise_app_exceptions=False),
        base_url="http://test",
    ) as client:
        response = await client.get("/squadrons/example/exists")
    assert response.status_code == 401


def test_shared_squadron_principal_cannot_authorize_another_squadron():
    principal = Principal(
        provider="clerk",
        mode="shared_squadron",
        subject="shared-account",
        squadron_id="123 VGS",
    )
    with pytest.raises(Exception) as error:
        authorize_squadron(principal, "999 VGS")
    assert getattr(error.value, "status_code", None) == 403


def test_individual_operator_cannot_authorize_squadron_wide_access():
    principal = Principal(
        provider="msal",
        mode="individual_operator",
        subject="operator-account",
        squadron_id="",
        operator_sn="12345",
    )
    with pytest.raises(Exception) as error:
        authorize_squadron(principal, "123 VGS")
    assert getattr(error.value, "status_code", None) == 403
