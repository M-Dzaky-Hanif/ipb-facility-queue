from enum import Enum as PyEnum
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class FacilityStatus(str, PyEnum):
    """Enum status operasional fasilitas kampus."""
    AVAILABLE = "Tersedia"
    MAINTENANCE = "Maintenance"

class Fasilitas(Base):
    __tablename__ = "fasilitas"

    id_fasilitas: Mapped[str] = mapped_column(String(50), primary_key=True, index=True) 
    nama_fasilitas: Mapped[str] = mapped_column(String(150)) 
    kapasitas: Mapped[int] = mapped_column(Integer) 
    lokasi: Mapped[str] = mapped_column(String(100)) 
    status: Mapped[str] = mapped_column(String(50), default=FacilityStatus.AVAILABLE.value) 
    fasilitas_pendukung: Mapped[str | None] = mapped_column(String(250), nullable=True) 

    # Relasi Agregasi: cascade save-update saja, tanpa delete-orphan
    alat: Mapped[list["Alat"]] = relationship("Alat", back_populates="fasilitas")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="fasilitas")

class Alat(Base):
    __tablename__ = "alat"

    id_alat: Mapped[str] = mapped_column(String(50), primary_key=True, index=True) 
    # Agregasi: ForeignKey bisa Null, dan diset Null jika fasilitas dihapus
    fasilitas_id: Mapped[str | None] = mapped_column(ForeignKey("fasilitas.id_fasilitas", ondelete="SET NULL"), nullable=True)
    nama_alat: Mapped[str] = mapped_column(String(150)) 
    jumlah: Mapped[int] = mapped_column(Integer) 
    lokasi: Mapped[str] = mapped_column(String(100)) 
    kondisi: Mapped[str] = mapped_column(String(50)) 

    fasilitas: Mapped["Fasilitas"] = relationship("Fasilitas", back_populates="alat")