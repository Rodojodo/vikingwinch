from core.schemas import ORMModel

class WinchRead(ORMModel):
    id: int
    registration: str
    squadron_id: str
