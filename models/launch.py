from sqlalchemy import String, Integer, TIMESTAMP, Enum
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from models.base import Base

class Launch(Base):
    __tablename__ = "launches"
    launch_number: Mapped[int] = mapped_column(Integer, primary_key=True)
    squadron_id: Mapped[str] = mapped_column(String(50), nullable=False)
    winch_id: Mapped[int] = mapped_column(Integer, nullable=False)
    drum: Mapped[str] = mapped_column(Enum('left', 'right'), nullable=False)
    timestamp: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)
    operator_id: Mapped[str] = mapped_column(String(20), nullable=False)
    remarks : Mapped[str | None] = mapped_column(String, nullable=True)

