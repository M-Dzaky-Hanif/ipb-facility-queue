from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Queue(Base):
    __tablename__ = "queues"

    id_queue: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    fasilitas_id: Mapped[str] = mapped_column(ForeignKey("fasilitas.id_fasilitas"))
    mahasiswa_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    
    nomor_antrian: Mapped[int] = mapped_column(Integer)
    waktu_masuk: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True) # False jika sudah dipanggil/selesai

    # Relasi
    mahasiswa: Mapped["User"] = relationship("User")
    fasilitas: Mapped["Fasilitas"] = relationship("Fasilitas")