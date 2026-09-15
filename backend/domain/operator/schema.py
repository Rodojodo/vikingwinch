from typing import Literal
from domain.day_log.schema import ORMModel

class OperatorRead(ORMModel):
    service_no: str
    entra_oid: str
    name: str
    squadron_id: str
    qualification_level: Literal["trainee", "operator", "instructor", "examiner"]
