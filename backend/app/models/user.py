import enum
from sqlalchemy import String, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class UserRole(str, enum.Enum):
    MAHASISWA = "mahasiswa"
    TENDIK = "tendik"
    ADMIN = "admin"
    STAFF = "staff_ruang"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    nama: Mapped[str] = mapped_column(String(100)) 
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True) 
    password: Mapped[str] = mapped_column(String(255)) 
    role: Mapped[UserRole] = mapped_column(Enum(UserRole))
    
    # Atribut identitas spesifik
    nim: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True) 
    nip: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True) 
    id_admin: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True) 
    id_staff: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True) 

    # Relasi
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="mahasiswa", foreign_keys="[Booking.mahasiswa_id]")
    approved_bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="tendik", foreign_keys="[Booking.tendik_id]") 
    notifikasi: Mapped[list["Notifikasi"]] = relationship("Notifikasi", back_populates="user")