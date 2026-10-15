import asyncio
import httpx
import logging
import os
from datetime import date, timedelta
from typing import Any
from urllib.parse import quote

logger = logging.getLogger(__name__)

DEFAULT_BASE_URL = "https://test.stars.api/api"
DEFAULT_CLIENT_ID = "test_client_id"
DEFAULT_RESOURCE_TYPE_ID = "T:14553"


def _get_env_int(key: str) -> int | None:
    val = os.environ.get(key)
    if val is not None and val.strip():
        try:
            return int(val.strip())
        except ValueError:
            return None
    return None


MAP_ID_C005_OPERATOR = _get_env_int("OPERATOR_QUAL")
MAP_ID_E004_INSTRUCTOR = _get_env_int("INSTRUCTOR_QUAL")
MAP_ID_C003_EXAMINER = _get_env_int("EXAMINER_QUAL")
CURRENCY_ID_SKYLAUNCH_WINCHING = _get_env_int("SKYLAUNCH_WINCHING_QUAL")


def _normalize_state(raw_state: str | None) -> str:
    if not raw_state or raw_state.lower() in ("none", "nil"):
        return "nil"
    return raw_state.lower()


def _parse_date(raw_date: str | None) -> date | None:
    if not raw_date or not isinstance(raw_date, str):
        return None
    try:
        return date.fromisoformat(raw_date[:10])
    except ValueError:
        return None


class StarsClient:
    def __init__(
        self,
        token: str | None = None,
        client_id: str | None = None,
        base_url: str | None = None,
            resource_type_id: str | None = None,
            operator_qual_id: int | None = None,
            instructor_qual_id: int | None = None,
            examiner_qual_id: int | None = None,
            skylaunch_qual_id: int | None = None,
    ):
        self.token = token or os.environ.get("STARS_API_KEY") or os.environ.get(
            "STARS_TOKEN", ""
        )
        self.client_id = client_id or os.environ.get(
            "STARS_CLIENT_ID", DEFAULT_CLIENT_ID
        )
        self.base_url = (
                base_url or os.environ.get("STARS_BASE_URL") or DEFAULT_BASE_URL
        ).rstrip("/")
        self.resource_type_id = (
                resource_type_id
                or os.environ.get("STARS_RESOURCE_TYPE_ID")
                or DEFAULT_RESOURCE_TYPE_ID
        )
        self.operator_qual_id = (
            operator_qual_id
            if operator_qual_id is not None
            else _get_env_int("OPERATOR_QUAL")
        )
        self.instructor_qual_id = (
            instructor_qual_id
            if instructor_qual_id is not None
            else _get_env_int("INSTRUCTOR_QUAL")
        )
        self.examiner_qual_id = (
            examiner_qual_id
            if examiner_qual_id is not None
            else _get_env_int("EXAMINER_QUAL")
        )
        self.skylaunch_qual_id = (
            skylaunch_qual_id
            if skylaunch_qual_id is not None
            else _get_env_int("SKYLAUNCH_WINCHING_QUAL")
        )
        self.mock_mode = os.environ.get("STARS_MOCK_MODE", "false").strip().lower() in (
            "true",
            "1",
            "yes",
        )

    def _headers(self) -> dict[str, str]:
        headers = {
            "Client-ID": self.client_id,
            "X-Requested-With": "XMLHttpRequest",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def _get_json(
            self, path: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{self.base_url}/{path.lstrip('/')}",
                params=params,
                headers=self._headers(),
            )
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, dict):
                raise ValueError("STARS returned a non-object JSON response")
            return payload

    async def get_people_for_unit(self, unit_id: int) -> list[dict[str, Any]]:
        payload = await self._get_json(
            "resource/resources",
            {"resourceTypeIDs": self.resource_type_id, "orgUnitIDs": unit_id},
        )
        people = payload.get("data", [])
        if not isinstance(people, list):
            raise ValueError("STARS personnel response has invalid data")
        return [person for person in people if isinstance(person, dict)]

    async def get_eng_auths_for_user(
            self, resource_id: str, base_date: str | None = None
    ) -> dict[str, Any]:
        return await self._get_json(
            f"eng/personnel/{quote(resource_id, safe='')}/auths",
            {
                "view": "Current",
                "baseDate": base_date or date.today().isoformat(),
            },
        )

    async def get_currencies_for_user(
            self, resource_id: str, base_date: str | None = None
    ) -> dict[str, Any]:
        params: dict[str, Any] = {
            "resourceIDs": resource_id,
            "baseDate": base_date or date.today().isoformat(),
            "includeDetails": "false",
        }
        if self.skylaunch_qual_id is not None:
            params["currencyIDs"] = str(self.skylaunch_qual_id)
        return await self._get_json(
            "qcc/personnel/currencies",
            params,
        )

    async def fetch_user_qualifications(
            self, service_no: str, unit_id: int | None = None
    ) -> dict[str, Any]:
        if self.mock_mode:
            return self._mock_qualifications(service_no)

        if unit_id is None:
            raise ValueError("Unit ID is required to fetch live qualifications")

        people = await self.get_people_for_unit(unit_id)
        person = next(
            (item for item in people if str(item.get("code")) == str(service_no)),
            None,
        )
        if person is None or person.get("id") is None:
            return self._mock(None, "nil", "nil", "nil", "nil")

        resource_id = str(person["id"])
        auths_response, currencies_response = await asyncio.gather(
            self.get_eng_auths_for_user(resource_id),
            self.get_currencies_for_user(resource_id),
        )
        result = self._mock(resource_id, "nil", "nil", "nil", "nil")
        fields: dict[int, tuple[str, str]] = {}
        if self.operator_qual_id is not None:
            fields[self.operator_qual_id] = ("c005_operator", "c005_expiry")
        if self.instructor_qual_id is not None:
            fields[self.instructor_qual_id] = ("e004_instructor", "e004_expiry")
        if self.examiner_qual_id is not None:
            fields[self.examiner_qual_id] = ("c003_examiner", "c003_expiry")

        if not fields:
            logger.warning(
                "No qualification map IDs configured; authorisations cannot be mapped."
            )

        auths = auths_response.get("data", [])
        if not isinstance(auths, list):
            raise ValueError("STARS authorisations response has invalid data")
        for auth in auths:
            if not isinstance(auth, dict):
                continue
            try:
                map_id = int(auth.get("mapId"))
            except (TypeError, ValueError):
                continue
            field = fields.get(map_id)
            if field:
                result[field[0]] = _normalize_state(auth.get("currencyState"))
                result[field[1]] = _parse_date(auth.get("expiry"))

        entries = currencies_response.get("data", [])
        if not isinstance(entries, list):
            raise ValueError("STARS currencies response has invalid data")
        entry = next(
            (item for item in entries if item.get("id") == resource_id),
            entries[0] if entries else {},
        )
        currencies = entry.get("currencies", []) if isinstance(entry, dict) else []
        currency = next(
            (
                item
                for item in currencies
                if isinstance(item, dict)
                   and self.skylaunch_qual_id is not None
                   and str(item.get("id")) == str(self.skylaunch_qual_id)
            ),
            None,
        )
        if currency:
            result["rolling_currency"] = _normalize_state(currency.get("state"))
            result["rolling_expiry"] = _parse_date(currency.get("expiry"))
        return result

    @staticmethod
    def _mock_qualifications(service_no: str) -> dict[str, Any]:
        sn = service_no.lower()
        if "disqualified" in sn:
            return StarsClient._mock("R:MOCK_DISQ", "red", "red", "red", "red")
        if "blue" in sn:
            return StarsClient._mock("R:MOCK_BLUE", "blue", "blue", "blue", "blue")
        if "instructor_dual_only" in sn:
            return StarsClient._mock("R:MOCK_INST", "nil", "green", "nil", "green")
        if "solo_only" in sn:
            return StarsClient._mock("R:MOCK_SOLO", "green", "nil", "nil", "green")
        if "unqualified" in sn:
            return StarsClient._mock(None, "nil", "nil", "nil", "nil")
        return StarsClient._mock("R:MOCK_DEFAULT", "green", "green", "nil", "green")

    @staticmethod
    def _mock(
            resource_id: str | None,
            c005: str,
            e004: str,
            c003: str,
            rolling: str,
    ) -> dict[str, Any]:
        expiry = date.today() + timedelta(days=90)
        return {
            "stars_resource_id": resource_id,
            "c005_operator": c005,
            "c005_expiry": expiry if c005 in ("green", "amber") else None,
            "e004_instructor": e004,
            "e004_expiry": expiry if e004 in ("green", "amber") else None,
            "c003_examiner": c003,
            "c003_expiry": expiry if c003 in ("green", "amber") else None,
            "rolling_currency": rolling,
            "rolling_expiry": expiry if rolling in ("green", "amber") else None,
        }
