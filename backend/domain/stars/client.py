import asyncio
import httpx
import os
from datetime import date, timedelta
from typing import Any
from urllib.parse import quote

DEFAULT_BASE_URL = "https://test.stars.api/api"
DEFAULT_CLIENT_ID = "test_client_id"

MAP_ID_C005_OPERATOR = os.environ.get("OPERATOR_QUAL")
MAP_ID_E004_INSTRUCTOR = os.environ.get("INSTRUCTOR_QUAL")
MAP_ID_C003_EXAMINER = os.environ.get("EXAMINER_QUAL")
CURRENCY_ID_SKYLAUNCH_WINCHING = os.environ.get("SKYLAUNCH_WINCHING_QUAL")



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
    ):
        self.token = token or os.environ.get("STARS_API_KEY") or os.environ.get("STARS_TOKEN") or ""
        self.client_id = client_id or os.environ.get("STARS_CLIENT_ID") or DEFAULT_CLIENT_ID
        self.base_url = (base_url or os.environ.get("STARS_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self.mock_mode = os.environ.get("STARS_MOCK_MODE", "false").strip().lower() in ("true", "1", "yes")

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Client-ID": self.client_id,
            "X-Requested-With": "XMLHttpRequest",
        }

    def get_people_for_unit(self, unit_id: str) -> list[dict[str, Any]]:
        url = f"{STARS_URI}/person/personnel"
        try:
            # The parameter is orgUnitID; STARS answers orgUnitId with a 405.
            listing = requests.get(
                url, params={"orgUnitID": unit_id}, headers=auth_header(), timeout=30
            )
            listing.raise_for_status()
            ids = [person["id"] for person in listing.json().get("data", [])]
            if not ids:
                logger.warning("No people found for unit %s", unit_id)
                return []

            # ponytail: one batched call, fine for a squadron, split it past ~500 ids.
            detail = requests.get(
                url, params={"ids": ",".join(ids)}, headers=auth_header(), timeout=60
            )
            detail.raise_for_status()
            records = detail.json().get("data", [])
        except (requests.RequestException, ValueError, KeyError) as e:
            logger.error("Failed to fetch people for unit %s: %s", unit_id, e)
            raise StarsAPIError(f"Failed to fetch unit personnel: {e}") from e
        return records

    def get_eng_auths_for_user(self, resource_id: str) -> dict[str, Any]:
        url = f"{STARS_URI}/eng/personnel/{resource_id}/auths"
        currency_ids = ", ".join(str(x) for x in (MAP_ID_C005_OPERATOR, MAP_ID_E004_INSTRUCTOR, MAP_ID_C003_EXAMINER))
        params = {
            "view": "Current",
            "mapIDs": currency_ids,
            "baseDate": date.today().isoformat(),
        }
        try:
            r = requests.get(url, params=params, headers=auth_header(), timeout=30)
            r.raise_for_status()
        except requests.RequestException as e:
            logger.error("Failed to fetch auths for %s: %s", person_id, e)
            raise StarsAPIError(f"Failed to fetch engineering authorisations: {e}") from e
        return r.json()

    def get_currencies_for_user(self, resource_id: str) -> dict[str, Any]:
        url = f"{self.base_url}/api/qcc/personnel/currencies"
        currency_ids = CURRENCY_ID_SKYLAUNCH_WINCHING
        params = {
            "resourceIDs": resource_id,
            "currencyIDs": currency_ids,
            "baseDate": date.today().isoformat(),
        }

        try:
            r = requests.get(
                url,
                headers=auth_header(),
                params=params,
                timeout=30,
            )
            r.raise_for_status()
        except requests.RequestException as e:
            logger.error("Failed to fetch auths for %s: %s", person_id, e)
            raise StarsAPIError(f"Failed to fetch skylaunch winching currency: {e}") from e
        return r.json()

    def fetch_user_qualifications(
        self, service_no: str, unit_id: int
    ) -> dict[str, Any]:
        if self.mock_mode:
            sn = service_no.lower()
            state = "nil"
            resource_id = None
            if "disqualified" in sn:
                state, resource_id = "red", "R:MOCK_DISQ"
            elif "blue" in sn:
                state, resource_id = "blue", "R:MOCK_BLUE"
            elif "instructor_dual_only" in sn:
                return self._mock("R:MOCK_INST", "nil", "green", "nil", "green")
            elif "solo_only" in sn:
                return self._mock("R:MOCK_SOLO", "green", "nil", "nil", "green")
            elif "unqualified" not in sn:
                return self._mock("R:MOCK_DEFAULT", "green", "green", "nil", "green")
            return self._mock(resource_id, state, state, state, state)

        people = await self.get_people_for_unit(unit_id)
        person = next((item for item in people if str(item.get("code")) == str(service_no)), None)
        if person is None:
            return self._mock(None, "nil", "nil", "nil", "nil")
        resource_id = str(person["id"])
        auths_res, currencies_res = await asyncio.gather(
            self.get_eng_auths_for_user(resource_id),
            self.get_currencies_for_user(resource_id),
        )
        result = self._mock(resource_id, "nil", "nil", "nil", "nil")
        for auth in auths_res.get("data", []):
            mapping = {MAP_ID_C005_OPERATOR: "c005_operator", MAP_ID_E004_INSTRUCTOR: "e004_instructor",
                       MAP_ID_C003_EXAMINER: "c003_examiner"}
            field = mapping.get(auth.get("mapId"))
            if field:
                result[field] = _normalize_state(auth.get("currencyState"))
                result[field.replace("_operator", "_expiry").replace("_instructor", "_expiry").replace("_examiner",
                                                                                                       "_expiry")] = _parse_date(
                    auth.get("expiry"))
        entries = currencies_res.get("data", [])
        entry = next((item for item in entries if item.get("id") == resource_id), entries[0] if entries else {})
        currency = next(
            (item for item in entry.get("currencies", []) if int(item.get("id", -1)) == CURRENCY_ID_SKYLAUNCH_WINCHING),
            None)
        if currency:
            result["rolling_currency"] = _normalize_state(currency.get("state"))
            result["rolling_expiry"] = _parse_date(currency.get("expiry"))
        return result

    @staticmethod
    def _mock(resource_id: str | None, c005: str, e004: str, c003: str, rolling: str) -> dict[str, Any]:
        expiry = date.today() + timedelta(days=90)
        return {
            "stars_resource_id": resource_id,
            "c005_operator": c005, "c005_expiry": expiry if c005 in ("green", "amber") else None,
            "e004_instructor": e004, "e004_expiry": expiry if e004 in ("green", "amber") else None,
            "c003_examiner": c003, "c003_expiry": expiry if c003 in ("green", "amber") else None,
            "rolling_currency": rolling, "rolling_expiry": expiry if rolling in ("green", "amber") else None,
        }
