import httpx
import logging
from datetime import date, datetime, timedelta, timezone
from domain.operator.model import Operator
from domain.squadron.model import Squadron
from domain.stars import repository as stars_repo
from domain.stars.client import StarsClient
from domain.stars.model import OperatorQualifications
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
CACHE_TTL = timedelta(days=7)
STALE_RETRY_TTL = timedelta(minutes=15)
AMBER_WARNING_WINDOW = timedelta(days=30)
VALID_CURRENCY_STATES = {"green", "amber", "grey"}


def _is_cache_fresh(quals: OperatorQualifications) -> bool:
    if not quals.last_checked_at:
        return False
    checked = quals.last_checked_at
    if checked.tzinfo is None:
        checked = checked.replace(tzinfo=timezone.utc)
    ttl = STALE_RETRY_TTL if quals.is_stale else CACHE_TTL
    return datetime.now(timezone.utc) - checked <= ttl


def _evaluate_cached_state(state: str, expiry: date | None, today: date) -> str:
    if state not in ("green", "amber"):
        return state
    if expiry is None or expiry < today:
        return "red"
    if expiry <= today + AMBER_WARNING_WINDOW:
        return "amber"
    return state


async def _resolve_unit_id(db: AsyncSession, service_no: str) -> int:
    unit_id = await db.scalar(
        select(Squadron.stars_unit_id)
        .join(Operator, Operator.squadron_id == Squadron.id)
        .where(Operator.service_no == service_no)
    )
    if unit_id is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Operator squadron has no configured STARS unit",
        )
    return unit_id


async def refresh_qualifications(db: AsyncSession, service_no: str,
                                 client: StarsClient | None = None) -> OperatorQualifications:
    client = client or StarsClient()
    now = datetime.now(timezone.utc)
    try:
        if client.mock_mode:
            fetched = await client.fetch_user_qualifications(service_no)
        else:
            unit_id = await _resolve_unit_id(db, service_no)
            fetched = await client.fetch_user_qualifications(
                service_no, unit_id=unit_id
            )
    except (httpx.HTTPError, ValueError):
        logger.warning("STARS API unreachable for %s; applying fallback", service_no)
        existing = await stars_repo.get_qualifications_by_sn(db, service_no)
        if existing is None:
            return await stars_repo.upsert_qualifications(
                db, service_no, c005_operator="grey", e004_instructor="grey",
                c003_examiner="grey", rolling_currency="grey", is_stale=True,
                last_checked_at=now,
            )
        values = {
            field: _evaluate_cached_state(getattr(existing, field), getattr(existing, expiry), now.date())
            for field, expiry in (
                ("c005_operator", "c005_expiry"), ("e004_instructor", "e004_expiry"),
                ("c003_examiner", "c003_expiry"), ("rolling_currency", "rolling_expiry"),
            )
        }
        return await stars_repo.upsert_qualifications(
            db, service_no, stars_resource_id=existing.stars_resource_id,
            c005_operator=values["c005_operator"], c005_expiry=existing.c005_expiry,
            e004_instructor=values["e004_instructor"], e004_expiry=existing.e004_expiry,
            c003_examiner=values["c003_examiner"], c003_expiry=existing.c003_expiry,
            rolling_currency=values["rolling_currency"], rolling_expiry=existing.rolling_expiry,
            is_stale=True, last_checked_at=now,
        )
    return await stars_repo.upsert_qualifications(
        db, service_no, stars_resource_id=fetched.get("stars_resource_id"),
        c005_operator=fetched.get("c005_operator", "nil"), c005_expiry=fetched.get("c005_expiry"),
        e004_instructor=fetched.get("e004_instructor", "nil"), e004_expiry=fetched.get("e004_expiry"),
        c003_examiner=fetched.get("c003_examiner", "nil"), c003_expiry=fetched.get("c003_expiry"),
        rolling_currency=fetched.get("rolling_currency", "nil"), rolling_expiry=fetched.get("rolling_expiry"),
        is_stale=False, last_checked_at=now,
    )


async def get_or_refresh_qualifications(db: AsyncSession, service_no: str,
                                        client: StarsClient | None = None) -> OperatorQualifications:
    quals = await stars_repo.get_qualifications_by_sn(db, service_no)
    return quals if quals is not None and _is_cache_fresh(quals) else await refresh_qualifications(db, service_no,
                                                                                                   client)


async def get_committed_qualifications(db: AsyncSession, service_no: str) -> OperatorQualifications:
    quals = await get_or_refresh_qualifications(db, service_no)
    await db.commit()
    return quals


def is_valid_currency(state: str | None) -> bool:
    return state in VALID_CURRENCY_STATES


def enforce_winch_qualification_for_day_log(quals: OperatorQualifications, log_type: str,
                                            trainee_sn: str | None) -> None:
    if not is_valid_currency(quals.rolling_currency):
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            "Skylaunch Winching rolling currency (green/amber) required for winch operations.")
    can_solo = is_valid_currency(quals.c005_operator)
    can_dual = is_valid_currency(quals.e004_instructor) or is_valid_currency(quals.c003_examiner)
    if log_type == "di" and not can_solo:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "C005 Winch Operator green/amber required for Daily Inspection.")
    if log_type == "sign_on":
        if not can_solo and not can_dual:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No valid winching qualifications held.")
        if not can_dual and trainee_sn is not None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Solo operators cannot sign on with a trainee.")
        if not can_solo and trainee_sn is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Instructors/Examiners must sign on with a trainee.")
    if log_type not in ("di", "sign_on") and not can_solo and not can_dual:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No valid winching qualifications held.")


def enforce_winch_qualification_for_launch(quals: OperatorQualifications) -> None:
    if not is_valid_currency(quals.rolling_currency):
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            "Skylaunch Winching rolling currency (green/amber) required for launch operations.")
    if not (is_valid_currency(quals.c005_operator) or is_valid_currency(quals.e004_instructor) or is_valid_currency(
            quals.c003_examiner)):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No valid winching qualifications held.")
