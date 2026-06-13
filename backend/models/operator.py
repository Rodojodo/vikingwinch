from sqlalchemy import String, Enum
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base

class Operator(Base):
    __tablename__ = "operators"
    service_no: Mapped[str] = mapped_column(String, primary_key=True)
    entra_oid: Mapped[str] = mapped_column(String(36), unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    squadron_id: Mapped[str] = mapped_column(String(50), nullable=False)
    qualification_level: Mapped[str] = mapped_column(Enum('trainee', 'operator', 'instructor', 'examiner'), nullable=False)