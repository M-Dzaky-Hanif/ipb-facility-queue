from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Notifikasi(Base):
    __tablename__ = "notifikasi"

    id_notifikasi: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True) 
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    pesan: Mapped[str] = mapped_column(Text) 
    waktu: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow) 
    status_baca: Mapped[bool] = mapped_column(Boolean, default=False) 

    user: Mapped["User"] = relationship("User", back_populates="notifikasi")