from pydantic import BaseModel, ConfigDict
from datetime import datetime

class NotifikasiResponse(BaseModel):
    id_notifikasi: int
    user_id: int
    pesan: str
    waktu: datetime
    status_baca: bool

    model_config = ConfigDict(from_attributes=True)
