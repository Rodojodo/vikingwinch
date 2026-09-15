from pydantic import BaseModel

class SquadronExistsResponse(BaseModel):
    id: str
    exists: bool
