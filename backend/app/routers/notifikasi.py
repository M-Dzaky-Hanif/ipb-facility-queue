from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.database import get_db
from app.models.notifikasi import Notifikasi
from app.schemas.notifikasi import NotifikasiResponse

router = APIRouter(
    prefix="/notifikasi",
    tags=["Notifikasi"]
)

@router.get("/user/{user_id}", response_model=List[NotifikasiResponse])
async def lihat_notifikasi_user(user_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Notifikasi).where(Notifikasi.user_id == user_id).order_by(Notifikasi.waktu.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/{id_notifikasi}/read", response_model=NotifikasiResponse)
async def tandai_dibaca(id_notifikasi: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Notifikasi).where(Notifikasi.id_notifikasi == id_notifikasi)
    result = await db.execute(stmt)
    notif = result.scalar_one_or_none()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan!")
    
    notif.status_baca = True
    
    try:
        await db.commit()
        await db.refresh(notif)
        return notif
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal memperbarui notifikasi: {str(e)}")

@router.put("/user/{user_id}/read-all")
async def tandai_semua_dibaca(user_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Notifikasi).where(Notifikasi.user_id == user_id, Notifikasi.status_baca == False)
    result = await db.execute(stmt)
    notifs = result.scalars().all()
    
    for notif in notifs:
        notif.status_baca = True
        
    try:
        await db.commit()
        return {"message": f"Berhasil menandai {len(notifs)} notifikasi sebagai dibaca."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal memperbarui semua notifikasi: {str(e)}")
