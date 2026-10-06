from datetime import date
import os
from typing import Any
import requests

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
        mock_env = os.environ.get("STARS_MOCK_MODE", "false").strip().lower()
        self.mock_mode = mock_env in ("true", "1", "yes")

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
            sn_lower = service_no.lower()
            if "unqualified" in sn_lower:
                return {
                    "stars_resource_id": None,
                    "c005_operator": "nil",
                    "e004_instructor": "nil",
                    "c003_examiner": "nil",
                    "rolling_currency": "nil",
                }
            if "disqualified" in sn_lower:
                return {
                    "stars_resource_id": "R:MOCK_DISQ",
                    "c005_operator": "red",
                    "e004_instructor": "red",
                    "c003_examiner": "red",
                    "rolling_currency": "red",
                }
            if "blue" in sn_lower:
                return {
                    "stars_resource_id": "R:MOCK_BLUE",
                    "c005_operator": "blue",
                    "e004_instructor": "blue",
                    "c003_examiner": "blue",
                    "rolling_currency": "blue",
                }
            if "instructor_dual_only" in sn_lower:
                return {
                    "stars_resource_id": "R:MOCK_INST",
                    "c005_operator": "nil",
                    "e004_instructor": "green",
                    "c003_examiner": "nil",
                    "rolling_currency": "green",
                }
            if "solo_only" in sn_lower:
                return {
                    "stars_resource_id": "R:MOCK_SOLO",
                    "c005_operator": "green",
                    "e004_instructor": "nil",
                    "c003_examiner": "nil",
                    "rolling_currency": "green",
                }
            return {
                "stars_resource_id": "R:MOCK_DEFAULT",
                "c005_operator": "green",
                "e004_instructor": "green",
                "c003_examiner": "nil",
                "rolling_currency": "green",
            }

        people = self.get_people_for_unit(unit_id)
        person = next((p for p in people if str(p.get("code")) == str(service_no)), None)
        if not person:
            return {
                "stars_resource_id": None,
                "c005_operator": "nil",
                "e004_instructor": "nil",
                "c003_examiner": "nil",
                "rolling_currency": "nil",
            }

        resource_id = str(person["id"])
        auths_res = self.get_eng_auths_for_user(resource_id)
        curr_res = self.get_currencies_for_user(resource_id)

        c005_operator = "nil"
        e004_instructor = "nil"
        c003_examiner = "nil"
        rolling_currency = "nil"

        auths_data = auths_res.get("data", [])
        if auths_data and isinstance(auths_data, list):
            user_auths = auths_data[0].get("auths", [])
            for auth in user_auths:
                auth_id = auth.get("id")
                state = auth.get("state")
                if auth_id == MAP_ID_C005_OPERATOR:
                    c005_operator = _normalize_state(state)
                elif auth_id == MAP_ID_E004_INSTRUCTOR:
                    e004_instructor = _normalize_state(state)
                elif auth_id == MAP_ID_C003_EXAMINER:
                    c003_examiner = _normalize_state(state)

        curr_data = curr_res.get("data", [])
        if curr_data and isinstance(curr_data, list):
            user_currs = curr_data[0].get("currencies", [])
            for curr in user_currs:
                if curr.get("id") == CURRENCY_ID_SKYLAUNCH_WINCHING:
                    rolling_currency = _normalize_state(curr.get("state"))

        return {
            "stars_resource_id": resource_id,
            "c005_operator": c005_operator,
            "e004_instructor": e004_instructor,
            "c003_examiner": c003_examiner,
            "rolling_currency": rolling_currency,
        }
