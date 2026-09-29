from core.schemas import ORMModel
from pydantic import BaseModel
from domain.day_log.schema import DayLogRead
from domain.launch.schema import LaunchRead
from domain.operator.schema import OperatorRead
from typing import Literal

class WinchRead(ORMModel):
    id: int
    registration: str
    squadron_id: str

class WinchStatusRead(WinchRead):
    status: Literal["default", "di_complete", "in_use", "day_finished"]

class BroughtForwardInfoResponse(BaseModel):
    left: int | None
    right: int | None
    hours: float | None

class WinchDayDataResponse(BaseModel):
    logs: list[DayLogRead]
    launches: list[LaunchRead]
    cable_check_verified: bool

class BroughtForwardData(BaseModel):
    left: int | None
    right: int | None

class ExportDataResponse(BaseModel):
    winch: WinchRead
    logs: list[DayLogRead]
    launches: list[LaunchRead] = []
    operators: list[OperatorRead]
    brought_forward: BroughtForwardData
