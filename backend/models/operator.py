from sqlalchemy import String, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .squadron import Squadron

class Operator(Base):
    __tablename__ = "operators"
    service_no: Mapped[str] = mapped_column(String(20), primary_key=True)
    entra_oid: Mapped[str] = mapped_column(String(36), unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    squadron_id: Mapped[str] = mapped_column(ForeignKey("squadrons.id"), nullable=False)
    qualification_level: Mapped[str] = mapped_column(Enum('trainee', 'operator', 'instructor', 'examiner'), nullable=False)

    squadron: Mapped["Squadron"] = relationship()