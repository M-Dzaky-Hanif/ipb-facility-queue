from pydantic import BaseModel, ConfigDict
from datetime import date, time
from typing import Optional
from app.models.booking import BookingStatus

class BookingBase(BaseModel):
    fasilitas_id: str
    tanggal: date
    jam: time
    keperluan: str

class BookingCreate(BookingBase):
    mahasiswa_id: int  # ID User Mahasiswa yang mengajukan

class BookingApproval(BaseModel):
    status: BookingStatus  # APPROVED atau REJECTED
    tendik_id: int        # ID User Tendik yang melakukan aksi

class BookingResponse(BookingBase):
    id_booking: int
    mahasiswa_id: int
    tendik_id: Optional[int] = None
    status: BookingStatus

    model_config = ConfigDict(from_attributes=True)