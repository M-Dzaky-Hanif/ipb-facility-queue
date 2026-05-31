from pydantic import BaseModel, ConfigDict
from datetime import datetime

class QueueCreate(BaseModel):
    fasilitas_id: str
    mahasiswa_id: int

class QueueResponse(BaseModel):
    id_queue: int
    fasilitas_id: str
    mahasiswa_id: int
    nomor_antrian: int
    waktu_masuk: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class QueueStudentResponse(QueueResponse):
    people_ahead: int