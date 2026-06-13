from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base

class Winch(Base):
    __tablename__ = "winches"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    registration: Mapped[str] = mapped_column(String(50), nullable=False)
    squadron_id: Mapped[str] = mapped_column(String(50), nullable=False)
