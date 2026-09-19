from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, field_validator, model_validator
from core.schemas import ORMModel

class LaunchCreate(BaseModel):
    squadron_id: str
    winch_id: int
    operator_sn: str
    drum: Literal["left", "right"]
    is_burn: bool = False

class LaunchCorrectionCreate(BaseModel):
    winch_id: int = Field(ge=1)
    squadron_id: str | None = None
    operator_sn: str | None = None
    left: int | None = None
    right: int | None = None

    @field_validator("left", "right")
    @classmethod
    def validate_non_negative(cls, v: int | None) -> int | None:
        if v is not None:
            if v < 0:
                raise ValueError("Drum correction value must be non-negative (>= 0)")
            if v > 2147483647:
                raise ValueError("Drum correction value must be <= 2147483647")
        return v

    @model_validator(mode="after")
    def validate_at_least_one_drum(self) -> "LaunchCorrectionCreate":
        if self.left is None and self.right is None:
            raise ValueError("At least one drum correction (left or right) must be specified")
        return self

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
