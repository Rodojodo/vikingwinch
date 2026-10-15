import pytest
from datetime import date, timedelta
from domain.stars.client import StarsClient


@pytest.mark.asyncio
async def test_mock_mode_profiles(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "true")
    quals = await StarsClient().fetch_user_qualifications("OFF-1001", 1234)
    assert quals["c005_operator"] == "green"
    assert quals["rolling_expiry"] == date.today() + timedelta(days=90)


@pytest.mark.asyncio
async def test_mock_mode_unqualified(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "true")
    quals = await StarsClient().fetch_user_qualifications("unqualified_user", 1234)
    assert all(
        quals[field] == "nil"
        for field in (
            "c005_operator",
            "e004_instructor",
            "c003_examiner",
            "rolling_currency",
        )
    )


@pytest.mark.asyncio
async def test_live_payload_parsing(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "false")
    monkeypatch.setenv("OPERATOR_QUAL", "101")
    monkeypatch.setenv("INSTRUCTOR_QUAL", "102")
    monkeypatch.setenv("EXAMINER_QUAL", "103")
    monkeypatch.setenv("SKYLAUNCH_WINCHING_QUAL", "201")
    monkeypatch.setenv("STARS_RESOURCE_TYPE_ID", "T:TEST")

    client = StarsClient(base_url="https://stars.example/api", token="secret")

    async def people(_unit_id):
        return [{"id": "R:123456", "code": "OFF-1001"}]

    async def auths(_resource_id, base_date=None):
        return {
            "data": [
                {"mapId": 101, "currencyState": "green", "expiry": "2027-02-01"},
                {"mapId": 102, "currencyState": "amber", "expiry": "2026-11-01"},
                {"mapId": 103, "currencyState": "none"},
            ]
        }

    async def currencies(_resource_id, base_date=None):
        return {
            "data": [
                {
                    "id": "R:123456",
                    "currencies": [
                        {
                            "id": 201,
                            "state": "green",
                            "expiry": "2027-02-01T00:00:00Z",
                        }
                    ],
                }
            ]
        }

    monkeypatch.setattr(client, "get_people_for_unit", people)
    monkeypatch.setattr(client, "get_eng_auths_for_user", auths)
    monkeypatch.setattr(client, "get_currencies_for_user", currencies)

    quals = await client.fetch_user_qualifications("OFF-1001", 1234)
    assert quals["stars_resource_id"] == "R:123456"
    assert quals["c005_operator"] == "green"
    assert quals["e004_instructor"] == "amber"
    assert quals["c003_examiner"] == "nil"
    assert quals["rolling_currency"] == "green"
    assert quals["rolling_expiry"] == date(2027, 2, 1)


@pytest.mark.asyncio
async def test_live_payload_parsing_unconfigured_env(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "false")
    monkeypatch.delenv("OPERATOR_QUAL", raising=False)
    monkeypatch.delenv("INSTRUCTOR_QUAL", raising=False)
    monkeypatch.delenv("EXAMINER_QUAL", raising=False)
    monkeypatch.delenv("SKYLAUNCH_WINCHING_QUAL", raising=False)

    client = StarsClient(base_url="https://stars.example/api", token="secret")

    async def people(_unit_id):
        return [{"id": "R:123456", "code": "OFF-1001"}]

    async def auths(_resource_id, base_date=None):
        return {"data": [{"mapId": 101, "currencyState": "green"}]}

    async def currencies(_resource_id, base_date=None):
        return {"data": [{"id": "R:123456", "currencies": [{"id": 201, "state": "green"}]}]}

    monkeypatch.setattr(client, "get_people_for_unit", people)
    monkeypatch.setattr(client, "get_eng_auths_for_user", auths)
    monkeypatch.setattr(client, "get_currencies_for_user", currencies)

    quals = await client.fetch_user_qualifications("OFF-1001", 1234)
    assert quals["stars_resource_id"] == "R:123456"
    # Unconfigured env vars mean maps cannot match, so defaults to nil
    assert quals["c005_operator"] == "nil"
    assert quals["rolling_currency"] == "nil"


@pytest.mark.asyncio
async def test_operator_not_found(monkeypatch):
    monkeypatch.setenv("STARS_MOCK_MODE", "false")
    client = StarsClient()

    async def no_people(_unit_id):
        return []

    monkeypatch.setattr(client, "get_people_for_unit", no_people)
    quals = await client.fetch_user_qualifications("unknown-service-no", 1234)
    assert quals["stars_resource_id"] is None
    assert quals["c005_operator"] == "nil"
