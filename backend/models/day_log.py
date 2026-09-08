from sqlalchemy import String, Enum, Float, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from models.base import Base

class Day_Log(Base):
    __tablename__ = "day_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    squadron_id: Mapped[str] = mapped_column(ForeignKey("squadrons.id"), nullable=False)
    winch_id: Mapped[int] = mapped_column(ForeignKey("winches.id"), nullable=False)
    type: Mapped[str] = mapped_column(Enum('finish_day', 'di', 'sign_on'), nullable=False)
    timestamp: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)
    left_drum: Mapped[int | None] = mapped_column(Integer, nullable=True)
    right_drum: Mapped[int | None] = mapped_column(Integer, nullable=True)
    operator_sn: Mapped[str] = mapped_column(ForeignKey("operators.service_no"), nullable=False)
    trainee: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cable_check: Mapped[str | None] = mapped_column(String(20), nullable=True)
    hours: Mapped[float | None] = mapped_column(Float, nullable=True)

    squadron: Mapped["Squadron"] = relationship()
    winch: Mapped["Winch"] = relationship()
    operator: Mapped["Operator"] = relationship()