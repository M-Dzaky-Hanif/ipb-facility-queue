from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.schemas.fasilitas import AlatBase, AlatResponse
from app.crud import alat as crud_alat

router = APIRouter(
    prefix="/alat",
    tags=["Alat Akademik"]
)

@router.post("/", response_model=AlatResponse)
async def create_alat(alat: AlatBase, db: AsyncSession = Depends(get_db)):
    return await crud_alat.create_alat(db=db, alat=alat)

@router.get("/", response_model=List[AlatResponse])
async def read_all_alat(db: AsyncSession = Depends(get_db)):
    return await crud_alat.get_all_alat(db=db)