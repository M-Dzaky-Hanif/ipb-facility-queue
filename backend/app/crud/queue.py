from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from fastapi import HTTPException
from app.models.queue import Queue
from app.models.notifikasi import Notifikasi
from app.schemas.queue import QueueCreate

async def join_queue(db: AsyncSession, queue_data: QueueCreate):
    # 1. Hitung nomor antrian terakhir yang aktif untuk fasilitas tersebut
    stmt = select(func.max(Queue.nomor_antrian)).where(
        Queue.fasilitas_id == queue_data.fasilitas_id,
        Queue.is_active == True
    )
    result = await db.execute(stmt)
    max_no = result.scalar()
    
    next_no = (max_no or 0) + 1

    # 2. Masukkan ke dalam antrian
    db_queue = Queue(
        fasilitas_id=queue_data.fasilitas_id,
        mahasiswa_id=queue_data.mahasiswa_id,
        nomor_antrian=next_no,
        is_active=True
    )
    db.add(db_queue)
    
    try:
        await db.commit()
        await db.refresh(db_queue)
        return db_queue
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

async def get_active_queue_by_facility(db: AsyncSession, fasilitas_id: str):
    stmt = select(Queue).where(
        Queue.fasilitas_id == fasilitas_id,
        Queue.is_active == True
    ).order_by(Queue.nomor_antrian.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

async def call_next_queue(db: AsyncSession, fasilitas_id: str):
    # 1. Ambil antrian terdepan (nomor paling kecil)
    stmt = select(Queue).where(
        Queue.fasilitas_id == fasilitas_id,
        Queue.is_active == True
    ).order_by(Queue.nomor_antrian.asc()).limit(1)
    
    result = await db.execute(stmt)
    current_queue = result.scalar_one_or_none()
    
    if not current_queue:
        raise HTTPException(status_code=404, detail="Tidak ada antrian aktif di fasilitas ini.")
    
    # 2. Ubah status antrian saat ini menjadi tidak aktif (selesai dipanggil)
    current_queue.is_active = False
    
    # 3. Kirim notifikasi otomatis ke Mahasiswa berikutnya jika ada
    stmt_next = select(Queue).where(
        Queue.fasilitas_id == fasilitas_id,
        Queue.is_active == True
    ).order_by(Queue.nomor_antrian.asc()).limit(1)
    
    result_next = await db.execute(stmt_next)
    next_queue = result_next.scalar_one_or_none()
    
    if next_queue:
        pesan_notif = f"Giliran Anda! Antrian Nomor {next_queue.nomor_antrian} untuk fasilitas {fasilitas_id} sekarang dipersilakan masuk."
        db_notif = Notifikasi(user_id=next_queue.mahasiswa_id, pesan=pesan_notif)
        db.add(db_notif)
        
    try:
        await db.commit()
        return {"message": f"Antrian nomor {current_queue.nomor_antrian} selesai. Notifikasi dikirim ke giliran berikutnya."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))