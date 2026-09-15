from datetime import datetime
from typing import Literal
from pydantic import BaseModel
from domain.day_log.schema import ORMModel

class LaunchCreate(BaseModel):
    squadron_id: str
    winch_id: int
    operator_sn: str
    drum: Literal["left", "right"]
    is_burn: bool = False

class RemarkCreate(BaseModel):
    launch_id: int
    remark: str

class RepairCreate(BaseModel):
    launch_id: int
    repair: str
    supervisor_id: str

class LaunchRead(ORMModel):
    launch_id: int
    launch_number: int | None
    squadron_id: str
    winch_id: int
    drum: Literal["left", "right"]
    timestamp: datetime | None
    operator_sn: str
    remarks: str | None
