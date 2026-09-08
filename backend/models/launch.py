from sqlalchemy import String, Integer, TIMESTAMP, Enum, UniqueConstraint, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from models.base import Base

class Launch(Base):
    __tablename__ = "launches"
    
    __table_args__ = (
        UniqueConstraint('winch_id', 'drum', 'launch_number', name='uix_winch_drum_launch_number'),
    )
    
    launch_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    launch_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    squadron_id: Mapped[str] = mapped_column(ForeignKey("squadrons.id"), nullable=False)
    winch_id: Mapped[int] = mapped_column(ForeignKey("winches.id"), nullable=False)
    drum: Mapped[str] = mapped_column(Enum('left', 'right'), nullable=False)
    timestamp: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)
    operator_sn: Mapped[str] = mapped_column(ForeignKey("operators.service_no"), nullable=False)
    remarks : Mapped[str | None] = mapped_column(Text, nullable=True)

    squadron: Mapped["Squadron"] = relationship()
    winch: Mapped["Winch"] = relationship()
    operator: Mapped["Operator"] = relationship()
