from database.base import Base
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column


class Squadron(Base):
    __tablename__ = "squadrons"
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    stars_unit_id: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
