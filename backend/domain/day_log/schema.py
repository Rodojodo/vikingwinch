from core.schemas import ORMModel
from datetime import datetime
from pydantic import BaseModel, field_validator
from typing import Literal


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

    @field_validator("trainee")
    @classmethod
    def normalize_trainee(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

class WinchHoursResponse(BaseModel):
    hours: float
