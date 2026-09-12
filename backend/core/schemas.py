from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Day log ---

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


class WinchHoursRead(BaseModel):
    hours: float

class BroughtForwardRead(BaseModel):
    left: int | None
    right: int | None


# --- Launches ---

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


# --- Operators ---

class OperatorRead(ORMModel):
    service_no: str
    entra_oid: str
    name: str
    squadron_id: str
    qualification_level: Literal["trainee", "operator", "instructor", "examiner"]


# --- Squadrons ---

class SquadronExistsRead(BaseModel):
    id: str
    exists: bool


# --- Winches ---

class WinchRead(ORMModel):
    id: int
    registration: str
    squadron_id: str