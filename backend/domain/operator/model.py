from sqlalchemy import String, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .squadron import Squadron

class Operator(Base):
    __tablename__ = "operators"
    service_no: Mapped[str] = mapped_column(String(20), primary_key=True)
    auth_provider: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="clerk",
        server_default="clerk",
    )
    auth_subject: Mapped[str] = mapped_column(String(255), nullable=False)
    auth_tenant_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
        server_default="",
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    squadron_id: Mapped[str] = mapped_column(ForeignKey("squadrons.id"), nullable=False)
    qualification_level: Mapped[str] = mapped_column(Enum('trainee', 'operator', 'instructor', 'examiner'), nullable=False)

    squadron: Mapped["Squadron"] = relationship()