from pydantic import BaseModel
from domain.day_log.schema import DayLogRead
from domain.launch.schema import LaunchRead
from domain.operator.schema import OperatorRead
from domain.winch.schema import WinchRead

class BroughtForwardInfoResponse(BaseModel):
    left: int | None
    right: int | None
    hours: float | None

class WinchDayDataResponse(BaseModel):
    logs: list[DayLogRead]
    launches: list[LaunchRead]

class BroughtForwardData(BaseModel):
    left: int | None
    right: int | None

class ExportDataResponse(BaseModel):
    winch: WinchRead
    logs: list[DayLogRead]
    launches: list[LaunchRead] = []
    operators: list[OperatorRead]
    brought_forward: BroughtForwardData
