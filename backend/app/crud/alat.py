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