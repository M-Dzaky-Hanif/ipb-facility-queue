from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.models.fasilitas import FacilityStatus

class AlatBase(BaseModel):
    id_alat: str
    fasilitas_id: Optional[str] = None
    nama_alat: str
    jumlah: int
    lokasi: str
    kondisi: str

class AlatResponse(AlatBase):
    # Otomatis mewarisi fasilitas_id dari AlatBase
    model_config = ConfigDict(from_attributes=True)

class FasilitasBase(BaseModel):
    id_fasilitas: str
    nama_fasilitas: str
    kapasitas: int
    lokasi: str
    status: str = FacilityStatus.AVAILABLE.value
    fasilitas_pendukung: Optional[str] = None

class FasilitasiCreate(FasilitasBase):
    pass

class FasilitasResponse(FasilitasBase):
    alat: List[AlatResponse] = [] 

    model_config = ConfigDict(from_attributes=True)