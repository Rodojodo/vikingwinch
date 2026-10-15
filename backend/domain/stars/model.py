from database.base import Base
from datetime import date, datetime, timezone
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from domain.operator.model import Operator


class OperatorQualifications(Base):
    __tablename__ = "operator_qualifications"

    service_no: Mapped[str] = mapped_column(
        String(20), ForeignKey("operators.service_no", ondelete="CASCADE"), primary_key=True
    )
    stars_resource_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    c005_operator: Mapped[str] = mapped_column(
        String(10), default="nil", server_default="nil", nullable=False
    )
    c005_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    e004_instructor: Mapped[str] = mapped_column(
        String(10), default="nil", server_default="nil", nullable=False
    )
    e004_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    c003_examiner: Mapped[str] = mapped_column(
        String(10), default="nil", server_default="nil", nullable=False
    )
    c003_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    rolling_currency: Mapped[str] = mapped_column(
        String(10), default="nil", server_default="nil", nullable=False
    )
    rolling_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_stale: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="0", nullable=False
    )
    last_checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    operator: Mapped["Operator"] = relationship(lazy="joined")
