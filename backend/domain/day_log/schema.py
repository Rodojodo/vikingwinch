from datetime import datetime
from typing import Literal
from pydantic import BaseModel
from core.schemas import ORMModel


class DayLogRead(ORMModel):
    id: int
    squadron_id: str
    winch_id: int
    type: Literal["finish_day", "di", "sign_on", "cable_check"]
    timestamp: datetime | None
    operator_sn: str
    trainee: str | None
    hours: float | None

class DayLogCreate(BaseModel):
    squadron_id: str
    type: Literal["finish_day", "di", "sign_on", "cable_check"]
    operator_sn: str
    trainee: str | None = None
    hours: float | None = None

class WinchHoursResponse(BaseModel):
    hours: float
