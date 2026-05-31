from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func  # Wajib diimport untuk mencari nomor antrian tertinggi
from fastapi import HTTPException

from app.models.booking import Booking, BookingStatus
from app.models.fasilitas import Fasilitas, FacilityStatus
from app.models.queue import Queue  # Wajib diimport untuk memasukkan user ke antrian
from app.models.notifikasi import Notifikasi
from app.schemas.booking import BookingCreate, BookingApproval

async def create_booking(db: AsyncSession, booking_data: BookingCreate):
    # 0. Validasi: Cek apakah fasilitas sedang dalam perbaikan
    stmt_fas = select(Fasilitas).where(Fasilitas.id_fasilitas == booking_data.fasilitas_id)
    res_fas = await db.execute(stmt_fas)
    fasilitas = res_fas.scalar_one_or_none()
    if fasilitas and fasilitas.status == FacilityStatus.MAINTENANCE.value:
        raise HTTPException(status_code=400, detail="Fasilitas sedang dalam maintenance dan tidak dapat dipesan saat ini.")

    # 1. Validasi: Cek apakah jadwal bentrok pada fasilitas, tanggal, dan jam yang sama
    stmt_cek = select(Booking).where(
        Booking.fasilitas_id == booking_data.fasilitas_id,
        Booking.tanggal == booking_data.tanggal,
        Booking.jam == booking_data.jam,
        Booking.status != BookingStatus.REJECTED  # Bentrok jika jadwal sudah disetujui (Approved)
    )
    result_cek = await db.execute(stmt_cek)
    bentrok = result_cek.scalar_one_or_none()

    if bentrok:
        # =========================================================================
        # SINKRONISASI OTOMATIS: Alihkan langsung ke Sistem Antrian (Queue)
        # =========================================================================
        # Hitung nomor antrian aktif terakhir untuk fasilitas ini
        stmt_queue = select(func.max(Queue.nomor_antrian)).where(
            Queue.fasilitas_id == booking_data.fasilitas_id,
            Queue.is_active == True
        )
        result_queue = await db.execute(stmt_queue)
        max_no = result_queue.scalar()
        next_no = (max_no or 0) + 1

        # Buat objek antrian baru
        db_queue = Queue(
            fasilitas_id=booking_data.fasilitas_id,
            mahasiswa_id=booking_data.mahasiswa_id,
            nomor_antrian=next_no,
            is_active=True
        )
        db.add(db_queue)
        
        try:
            await db.commit()
            # Kembalikan respons HTTP 202 Diterima (untuk diproses di antrian) beserta info detailnya
            raise HTTPException(
                status_code=202,
                detail={
                    "status": "queued",
                    "message": "Jadwal penuh! Anda otomatis dimasukkan ke dalam daftar antrian.",
                    "nomor_antrian": next_no,
                    "fasilitas_id": booking_data.fasilitas_id
                }
            )
        except HTTPException as he:
            raise he
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"Gagal memproses antrian otomatis: {str(e)}")

    # 2. Skenario Normal: Jika jadwal kosong, simpan data booking baru (Status default: Pending)
    db_booking = Booking(**booking_data.model_dump(), status=BookingStatus.PENDING)
    db.add(db_booking)
    
    try:
        await db.flush()  # Generate the ID first without committing
        
        # Buat Notifikasi untuk semua Staff Tendik secara otomatis
        from app.models.user import User, UserRole
        stmt_tendik = select(User).where(User.role == UserRole.TENDIK)
        res_tendik = await db.execute(stmt_tendik)
        tendiks = res_tendik.scalars().all()
        
        for tendik in tendiks:
            pesan_notif = f"Pengajuan peminjaman baru (#BK-00{db_booking.id_booking}) untuk fasilitas {db_booking.fasilitas_id} butuh evaluasi Anda! 🔔"
            db_notif = Notifikasi(user_id=tendik.id, pesan=pesan_notif)
            db.add(db_notif)
            
        await db.commit()
        await db.refresh(db_booking)
        return db_booking
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal mengajukan booking: {str(e)}")

async def get_all_bookings(db: AsyncSession):
    result = await db.execute(select(Booking))
    return result.scalars().all()

async def get_bookings_by_mahasiswa(db: AsyncSession, mahasiswa_id: int):
    stmt = select(Booking).where(Booking.mahasiswa_id == mahasiswa_id)
    result = await db.execute(stmt)
    return result.scalars().all()

async def manage_booking_approval(db: AsyncSession, id_booking: int, approval: BookingApproval):
    # 1. Cari data booking
    stmt = select(Booking).where(Booking.id_booking == id_booking)
    result = await db.execute(stmt)
    db_booking = result.scalar_one_or_none()
    
    if not db_booking:
        raise HTTPException(status_code=404, detail="Data booking tidak ditemukan!")
    
    # 1b. Jika disetujui, validasi apakah ada booking lain yang sudah APPROVED di slot yang sama
    if approval.status == BookingStatus.APPROVED:
        if db_booking.fasilitas_id:
            stmt_cek = select(Booking).where(
                Booking.fasilitas_id == db_booking.fasilitas_id,
                Booking.tanggal == db_booking.tanggal,
                Booking.jam == db_booking.jam,
                Booking.status == BookingStatus.APPROVED,
                Booking.id_booking != id_booking
            )
            res_cek = await db.execute(stmt_cek)
            existing_approved = res_cek.scalar_one_or_none()
            if existing_approved:
                raise HTTPException(
                    status_code=400,
                    detail=f"Fasilitas {db_booking.fasilitas_id} sudah disetujui untuk peminjaman lain pada tanggal {db_booking.tanggal} jam {db_booking.jam}. Harap tolak atau batalkan jadwal bentrok tersebut terlebih dahulu!"
                )
    
    # 2. Update status dan tendik pengambil keputusan
    db_booking.status = approval.status
    db_booking.tendik_id = approval.tendik_id
    
    # 3. Otomatisasi Notifikasi (Sesuai Use Case & Sequence Diagram kelompokmu)
    pesan_notif = f"Pengajuan peminjaman fasilitas {db_booking.fasilitas_id} untuk tanggal {db_booking.tanggal} telah {approval.status.value}."
    db_notif = Notifikasi(user_id=db_booking.mahasiswa_id, pesan=pesan_notif)
    db.add(db_notif)
    
    try:
        await db.commit()
        await db.refresh(db_booking)
        return db_booking
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal melakukan approval: {str(e)}")