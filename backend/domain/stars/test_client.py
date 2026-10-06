import pytest
from unittest.mock import patch, MagicMock
from domain.stars.client import StarsClient


def test_mock_mode_default(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "true")
    client = StarsClient()
    assert client.mock_mode is True

    quals = client.fetch_user_qualifications("OFF-1001")
    assert quals["c005_operator"] == "green"
    assert quals["e004_instructor"] == "green"
    assert quals["rolling_currency"] == "green"
    assert quals["stars_resource_id"] is not None


def test_mock_mode_unqualified(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "true")
    client = StarsClient()

    quals = client.fetch_user_qualifications("unqualified_user")
    assert quals["c005_operator"] == "nil"
    assert quals["e004_instructor"] == "nil"
    assert quals["c003_examiner"] == "nil"
    assert quals["rolling_currency"] == "nil"


def test_mock_mode_instructor_dual_only(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "true")
    client = StarsClient()

    quals = client.fetch_user_qualifications("instructor_dual_only")
    assert quals["c005_operator"] == "nil"
    assert quals["e004_instructor"] == "green"
    assert quals["c003_examiner"] == "nil"


def test_fetch_user_qualifications_live_parsing(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "false")
    monkeypatch.setenv("STARS_API_KEY", "test-token")
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


def test_fetch_user_qualifications_operator_not_found(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "false")
    monkeypatch.setenv("STARS_API_KEY", "test-token")
    client = StarsClient()

    mock_people = {
        "success": True,
        "data": [
            {"id": "R:999999", "name": "Other Person", "code": "9999999999999"},
        ],
    }

    mock_resp = MagicMock()
    mock_resp.raise_for_status.return_value = None
    mock_resp.json.return_value = mock_people

    with patch("requests.get", return_value=mock_resp):
        quals = client.fetch_user_qualifications("unknown-service-no")
        assert quals["stars_resource_id"] is None
        assert quals["c005_operator"] == "nil"
        assert quals["e004_instructor"] == "nil"
        assert quals["c003_examiner"] == "nil"
        assert quals["rolling_currency"] == "nil"
