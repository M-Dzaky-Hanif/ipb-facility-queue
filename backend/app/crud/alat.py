from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.models.fasilitas import Alat, Fasilitas
from app.schemas.fasilitas import AlatBase

async def create_alat(db: AsyncSession, alat: AlatBase):
    # Validasi: Jika fasilitas_id diisi, cek apakah fasilitasnya ada di DB
    if alat.fasilitas_id:
        stmt_cek = select(Fasilitas).where(Fasilitas.id_fasilitas == alat.fasilitas_id)
        cek_fasilitas = await db.execute(stmt_cek)
        if not cek_fasilitas.scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"Fasilitas dengan ID {alat.fasilitas_id} tidak ditemukan!")

    db_alat = Alat(**alat.model_dump())
    db.add(db_alat)
    
    try:
        await db.commit()
        # Mengambil data segar setelah commit
        stmt = select(Alat).where(Alat.id_alat == db_alat.id_alat)
        result = await db.execute(stmt)
        return result.scalar_one()
        
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Gagal menyimpan: ID Alat sudah terdaftar!")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

async def get_all_alat(db: AsyncSession):
    result = await db.execute(select(Alat))
    return result.scalars().all()

async def get_alat_by_id(db: AsyncSession, id_alat: str):
    # Fungsi pembantu buat nyari alat spesifik berdasarkan ID-nya
    stmt = select(Alat).where(Alat.id_alat == id_alat)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def update_alat(db: AsyncSession, id_alat: str, alat_update: AlatBase):
    # 1. Cari dulu alatnya ada apa nggak
    db_alat = await get_alat_by_id(db, id_alat)
    if not db_alat:
        return None
    
    # 2. Kalau ada, timpa data lama sama data baru
    # exclude_unset=True biar kolom yang gak diubah tetep aman
    for key, value in alat_update.model_dump(exclude_unset=True).items():
        setattr(db_alat, key, value)
        
    # 3. Save game (Commit) ke database
    try:
        await db.commit()
        await db.refresh(db_alat)
        return db_alat
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

async def delete_alat(db: AsyncSession, id_alat: str):
    # 1. Cari dulu alatnya
    db_alat = await get_alat_by_id(db, id_alat)
    if not db_alat:
        return False
        
    # 2. Kalau ketemu, hapus dari database
    try:
        await db.delete(db_alat)
        await db.commit()
        return True
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))