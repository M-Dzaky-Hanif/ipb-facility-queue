import enum
from datetime import date, time
from sqlalchemy import String, ForeignKey, Date, Time, Text, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class BookingStatus(str, enum.Enum):
    PENDING = "Pending" 
    APPROVED = "Approved" 
    REJECTED = "Rejected" 

class Booking(Base):
    __tablename__ = "bookings"

    id_booking: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True) 
    mahasiswa_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    tendik_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True) 
    
    # 1. Fasilitas dibuat nullable (opsional) jika suatu saat hanya pinjam alat murni
    fasilitas_id: Mapped[str | None] = mapped_column(ForeignKey("fasilitas.id_fasilitas"), nullable=True)

    # 2. KOLOM BARU: Untuk mencatat peminjaman alat
    alat_id: Mapped[str | None] = mapped_column(ForeignKey("alat.id_alat"), nullable=True)
    jumlah_alat: Mapped[int | None] = mapped_column(Integer, nullable=True)

    tanggal: Mapped[date] = mapped_column(Date) 
    jam: Mapped[time] = mapped_column(Time) 
    keperluan: Mapped[str] = mapped_column(Text) 
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.PENDING) 

    # Relasi
    mahasiswa: Mapped["User"] = relationship("User", foreign_keys=[mahasiswa_id], back_populates="bookings")
    tendik: Mapped["User"] = relationship("User", foreign_keys=[tendik_id], back_populates="approved_bookings")
    fasilitas: Mapped["Fasilitas"] = relationship("Fasilitas", back_populates="bookings")
    
    # 3. RELASI BARU: Menghubungkan ke tabel Alat (Unidirectional)
    alat: Mapped["Alat"] = relationship("Alat")