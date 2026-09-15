from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class DayLogRead(ORMModel):
    id: int
    squadron_id: str
    winch_id: int
    type: Literal["finish_day", "di", "sign_on"]
    timestamp: datetime | None
    operator_sn: str
    trainee: str | None
    cable_check: str | None
    hours: float | None

class DayLogCreate(BaseModel):
    squadron_id: str
    type: Literal["finish_day", "di", "sign_on"]
    operator_sn: str
    trainee: str | None = None
    cable_check: str | None = None
    hours: float | None = None

class WinchHoursResponse(BaseModel):
    hours: float
