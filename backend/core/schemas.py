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
    left_drum: int | None
    right_drum: int | None
    operator_id: str
    trainee: str | None
    cable_check: str
    hours: float


class DrumValuesRead(BaseModel):
    left_drum: int | None
    right_drum: int | None


# --- Launches ---

class LaunchCreate(BaseModel):
    squadron_id: str
    winch_id: int
    operator_id: str
    drum: Literal["left", "right"]


class RemarkCreate(BaseModel):
    winch_id: int
    drum: Literal["left", "right"]
    remark: str


class RepairCreate(BaseModel):
    winch_id: int
    drum: Literal["left", "right"]
    repair: str
    supervisor_id: str


class LaunchRead(ORMModel):
    launch_number: int
    squadron_id: str
    winch_id: int
    drum: Literal["left", "right"]
    timestamp: datetime | None
    operator_id: str
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