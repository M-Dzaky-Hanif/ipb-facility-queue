from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.booking import BookingCreate, BookingApproval, BookingResponse
from app.crud import booking as crud_booking

router = APIRouter(
    prefix="/bookings",
    tags=["Peminjaman & Approval"]
)

@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def ajukan_booking(booking_data: BookingCreate, db: AsyncSession = Depends(get_db)):
    return await crud_booking.create_booking(db=db, booking_data=booking_data)

@router.get("/", response_model=List[BookingResponse])
async def lihat_semua_booking(db: AsyncSession = Depends(get_db)):
    return await crud_booking.get_all_bookings(db=db)

@router.get("/mahasiswa/{mahasiswa_id}", response_model=List[BookingResponse])
async def lihat_booking_saya(mahasiswa_id: int, db: AsyncSession = Depends(get_db)):
    return await crud_booking.get_bookings_by_mahasiswa(db=db, mahasiswa_id=mahasiswa_id)

@router.put("/{id_booking}/approval", response_model=BookingResponse)
async def approval_booking(id_booking: int, approval: BookingApproval, db: AsyncSession = Depends(get_db)):
    return await crud_booking.manage_booking_approval(db=db, id_booking=id_booking, approval=approval)