from domain.day_log.schema import ORMModel

class WinchRead(ORMModel):
    id: int
    registration: str
    squadron_id: str
