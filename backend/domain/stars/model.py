from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

if TYPE_CHECKING:
    from domain.operator.model import Operator


class OperatorQualifications(Base):
    __tablename__ = "operator_qualifications"

    service_no: Mapped[str] = mapped_column(
        String(20), ForeignKey("operators.service_no"), primary_key=True
    )
    stars_resource_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    c005_operator: Mapped[str] = mapped_column(
        String(10), default="nil", server_default="nil", nullable=False
    )
    e004_instructor: Mapped[str] = mapped_column(
        String(10), default="nil", server_default="nil", nullable=False
    )
    c003_examiner: Mapped[str] = mapped_column(
        String(10), default="nil", server_default="nil", nullable=False
    )
    rolling_currency: Mapped[str] = mapped_column(
        String(10), default="nil", server_default="nil", nullable=False
    )
    last_checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    operator: Mapped["Operator"] = relationship(lazy="joined")
