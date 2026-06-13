from sqlalchemy import String, Enum, Float, Integer, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from models.base import Base

class Day_Log(Base):
    __tablename__ = "day_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    squadron_id: Mapped[str] = mapped_column(String(50), nullable=False)
    winch_id: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[str] = mapped_column(Enum('finish_day', 'di', 'sign_on'), nullable=False)
    timestamp: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)
    left_drum: Mapped[int | None] = mapped_column(Integer, nullable=True)
    right_drum: Mapped[int | None] = mapped_column(Integer, nullable=True)
    operator_id: Mapped[str] = mapped_column(String(20), nullable=False)
    trainee: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cable_check: Mapped[str] = mapped_column(String(20), nullable=False)
    hours: Mapped[float] = mapped_column(Float, nullable=False)