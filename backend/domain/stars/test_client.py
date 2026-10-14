import pytest
from datetime import date, timedelta
from domain.stars.client import StarsClient


@pytest.mark.asyncio
async def test_mock_mode_profiles(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "true")
    client = StarsClient()
    assert client.mock_mode is True

    quals = client.fetch_user_qualifications("OFF-1001")
    assert quals["c005_operator"] == "green"
    assert quals["rolling_expiry"] == date.today() + timedelta(days=90)


@pytest.mark.asyncio
async def test_mock_mode_unqualified(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "true")
    quals = await StarsClient().fetch_user_qualifications("unqualified_user")
    assert all(
        quals[field] == "nil" for field in ("c005_operator", "e004_instructor", "c003_examiner", "rolling_currency"))


@pytest.mark.asyncio
async def test_live_payload_parsing(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "false")
    client = StarsClient()

    # Mock responses for personnel, auths, and currencies
    mock_people = {
        "success": True,
        "data": [
            {"id": "R:123456", "name": "Joe Bloggs", "code": "OFF-1001"},
            {"id": "R:999999", "name": "Other Person", "code": "9999999999999"},
        ],
    }

    mock_auths = {
        "success": True,
        "data": [
            {
                "id": "R:123456",
                "auths": [
                    {"id": 1234, "state": "green", "expiry": "2027-02-01"},
                    {"id": 1235, "state": "amber", "expiry": "2026-11-01"},
                    {"id": 1236, "state": "none"},
                ],
            }
        ],
    }

    mock_currencies = {
        "success": True,
        "data": [
            {
                "id": "R:123456",
                "currencies": [
                    {"id": 123456, "name": "Skylaunch Winching", "state": "green"},
                ],
            }
        ],
    }

    def mock_get(url, *args, **kwargs):
        mock_resp = MagicMock()
        mock_resp.raise_for_status.return_value = None
        if "/api/resource/resources" in url:
            mock_resp.json.return_value = mock_people
        elif "/api/eng/personnel/auths/summary" in url:
            mock_resp.json.return_value = mock_auths
        elif "/api/qcc/personnel/currencies" in url:
            mock_resp.json.return_value = mock_currencies
        else:
            raise ValueError(f"Unexpected url: {url}")
        return mock_resp

    with patch("requests.get", side_effect=mock_get):
        quals = client.fetch_user_qualifications("OFF-1001")
        assert quals["stars_resource_id"] == "R:123456"
        assert quals["c005_operator"] == "green"
        assert quals["e004_instructor"] == "amber"
        assert quals["c003_examiner"] == "nil"  # "none" mapped to "nil"
        assert quals["rolling_currency"] == "green"


@pytest.mark.asyncio
async def test_operator_not_found(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "false")
    client = StarsClient()
    monkeypatch.setattr(client, "get_people_for_unit", lambda unit_id: _async_result([]))
    quals = await client.fetch_user_qualifications("unknown-service-no")
    assert quals["stars_resource_id"] is None
    assert quals["c005_operator"] == "nil"


async def _async_result(value):
    return value
