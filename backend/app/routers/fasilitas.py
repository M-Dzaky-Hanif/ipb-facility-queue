from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.schemas.fasilitas import FasilitasiCreate, FasilitasResponse
from app.crud import fasilitas as crud_fasilitas

router = APIRouter(
    prefix="/fasilitas",
    tags=["Fasilitas"]
)

@router.post("/", response_model=FasilitasResponse)
async def create_fasilitas(fasilitas: FasilitasiCreate, db: AsyncSession = Depends(get_db)):
    return await crud_fasilitas.create_fasilitas(db=db, fasilitas=fasilitas)

@router.get("/", response_model=List[FasilitasResponse])
async def read_all_fasilitas(db: AsyncSession = Depends(get_db)):
    return await crud_fasilitas.get_all_fasilitas(db=db)

@router.get("/{id_fasilitas}", response_model=FasilitasResponse)
async def read_fasilitas_by_id(id_fasilitas: str, db: AsyncSession = Depends(get_db)):
    db_fasilitas = await crud_fasilitas.get_fasilitas_by_id(db=db, id_fasilitas=id_fasilitas)
    if not db_fasilitas:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan!")
    return db_fasilitas

@router.put("/{id_fasilitas}", response_model=FasilitasResponse)
async def update_fasilitas(id_fasilitas: str, fasilitas_update: FasilitasiCreate, db: AsyncSession = Depends(get_db)):
    db_fasilitas = await crud_fasilitas.update_fasilitas(db=db, id_fasilitas=id_fasilitas, fasilitas_update=fasilitas_update)
    if not db_fasilitas:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan!")
    return db_fasilitas

@router.delete("/{id_fasilitas}")
async def delete_fasilitas(id_fasilitas: str, db: AsyncSession = Depends(get_db)):
    success = await crud_fasilitas.delete_fasilitas(db=db, id_fasilitas=id_fasilitas)
    if not success:
        raise HTTPException(status_code=404, detail="Fasilitas tidak ditemukan!")
    return {"message": f"Fasilitas {id_fasilitas} berhasil dihapus"}