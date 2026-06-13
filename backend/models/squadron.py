from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base

class Squadron(Base):
    __tablename__ = "squadrons"
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
