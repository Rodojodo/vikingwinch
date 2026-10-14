from core.schemas import ORMModel
from datetime import date, datetime


class OperatorQualificationsRead(ORMModel):
    service_no: str
    stars_resource_id: str | None = None
    c005_operator: str = "nil"
    c005_expiry: date | None = None
    e004_instructor: str = "nil"
    e004_expiry: date | None = None
    c003_examiner: str = "nil"
    c003_expiry: date | None = None
    rolling_currency: str = "nil"
    rolling_expiry: date | None = None
    is_stale: bool = False
    last_checked_at: datetime
