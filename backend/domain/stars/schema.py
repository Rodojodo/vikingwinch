from datetime import datetime
from core.schemas import ORMModel


class OperatorQualificationsRead(ORMModel):
    service_no: str
    stars_resource_id: str | None = None
    c005_operator: str = "nil"
    e004_instructor: str = "nil"
    c003_examiner: str = "nil"
    rolling_currency: str = "nil"
    last_checked_at: datetime
