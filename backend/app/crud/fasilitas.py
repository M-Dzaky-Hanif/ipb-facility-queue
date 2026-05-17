from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.models.fasilitas import Fasilitas
from app.schemas.fasilitas import FasilitasiCreate

async def create_fasilitas(db: AsyncSession, fasilitas: FasilitasiCreate):
    db_fasilitas = Fasilitas(**fasilitas.model_dump())
    db.add(db_fasilitas)
    
    try:
        await db.commit()
        
        # PERBAIKAN: Mengambil ulang data beserta relasinya secara eksplisit
        # untuk mencegah MissingGreenletError saat Pydantic membaca data
        stmt = select(Fasilitas).options(selectinload(Fasilitas.alat)).where(Fasilitas.id_fasilitas == db_fasilitas.id_fasilitas)
        result = await db.execute(stmt)
        
        return result.scalar_one()
    
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Gagal menyimpan: ID Fasilitas sudah terdaftar!")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

async def get_all_fasilitas(db: AsyncSession):
    result = await db.execute(
        select(Fasilitas).options(selectinload(Fasilitas.alat))
    )
    return result.scalars().all()

async def get_fasilitas_by_id(db: AsyncSession, id_fasilitas: str):
    stmt = select(Fasilitas).options(selectinload(Fasilitas.alat)).where(Fasilitas.id_fasilitas == id_fasilitas)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def update_fasilitas(db: AsyncSession, id_fasilitas: str, fasilitas_update: FasilitasiCreate):
    db_fasilitas = await get_fasilitas_by_id(db, id_fasilitas)
    if not db_fasilitas:
        return None
    
    # Update data atribut
    for key, value in fasilitas_update.model_dump().items():
        setattr(db_fasilitas, key, value)
        
    try:
        await db.commit()
        await db.refresh(db_fasilitas)
        
        # Ambil ulang data segar beserta relasi alatnya
        stmt = select(Fasilitas).options(selectinload(Fasilitas.alat)).where(Fasilitas.id_fasilitas == id_fasilitas)
        result = await db.execute(stmt)
        return result.scalar_one()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

async def delete_fasilitas(db: AsyncSession, id_fasilitas: str):
    db_fasilitas = await get_fasilitas_by_id(db, id_fasilitas)
    if not db_fasilitas:
        return False
        
    try:
        await db.delete(db_fasilitas)
        await db.commit()
        return True
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))