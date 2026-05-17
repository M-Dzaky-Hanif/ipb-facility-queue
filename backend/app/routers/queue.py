from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.queue import QueueCreate, QueueResponse
from app.crud import queue as crud_queue

router = APIRouter(
    prefix="/queues",
    tags=["Sistem Antrian (Queue)"]
)

@router.post("/join", response_model=QueueResponse, status_code=status.HTTP_201_CREATED)
async def masuk_antrian(queue_data: QueueCreate, db: AsyncSession = Depends(get_db)):
    return await crud_queue.join_queue(db=db, queue_data=queue_data)

@router.get("/facility/{fasilitas_id}", response_model=List[QueueResponse])
async def lihat_antrian_fasilitas(fasilitas_id: str, db: AsyncSession = Depends(get_db)):
    return await crud_queue.get_active_queue_by_facility(db=db, fasilitas_id=fasilitas_id)

@router.post("/facility/{fasilitas_id}/next")
async def panggil_antrian_berikutnya(fasilitas_id: str, db: AsyncSession = Depends(get_db)):
    return await crud_queue.call_next_queue(db=db, fasilitas_id=fasilitas_id)