from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from contextlib import asynccontextmanager

# Import semua model agar terdeteksi oleh SQLAlchemy untuk sinkronisasi tabel
from app.models.user import User
from app.models.fasilitas import Fasilitas, Alat
from app.models.booking import Booking
from app.models.notifikasi import Notifikasi
from app.models.queue import Queue

# IMPORT ROUTER BARU
from app.routers import fasilitas, alat, user as auth_user, booking, queue as queue_router, notifikasi as notif_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="IPB Campus Facility & Queue System API",
    description="API untuk mengelola peminjaman dan antrian fasilitas kampus",
    version="1.0.0",
    lifespan=lifespan
)

# Konfigurasi CORS untuk Frontend React (Tailwind v4)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DAFTARKAN ROUTER KE APLIKASI
app.include_router(fasilitas.router, prefix="/api/v1")
app.include_router(alat.router, prefix="/api/v1")
app.include_router(auth_user.router, prefix="/api/v1")
app.include_router(booking.router, prefix="/api/v1")
app.include_router(queue_router.router, prefix="/api/v1")
app.include_router(notif_router.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Sistem Backend Fasilitas IPB Aktif"}