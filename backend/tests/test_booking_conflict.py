import pytest
from httpx import AsyncClient, ASGITransport
import time  # <-- Tambahkan import time untuk membuat suffix unik
from app.main import app

pytestmark = pytest.mark.asyncio

BASE_URL = "http://test/api/v1"

async def test_skenario_jadwal_bentrok_ke_antrian():
    async with AsyncClient(transport=ASGITransport(app=app), base_url=BASE_URL) as ac:
        
        # Suffix dinamis menggunakan timestamp agar data tidak pernah duplikat di DB lokal
        suffix = f"conf_{int(time.time())}"

        # Data Dummy untuk Pengujian (Sekarang otomatis selalu unik)
        data_mhs1 = {"nama": "Dzaky Mhs 1", "email": f"mhs1_{suffix}@apps.ipb.ac.id", "role": "mahasiswa", "nim": f"NIM1_{suffix}", "password": "password123"}
        data_mhs2 = {"nama": "Thoriq Mhs 2", "email": f"mhs2_{suffix}@apps.ipb.ac.id", "role": "mahasiswa", "nim": f"NIM2_{suffix}", "password": "password123"}
        data_tendik = {"nama": "Budi Tendik", "email": f"tendik_{suffix}@apps.ipb.ac.id", "role": "tendik", "nip": f"NIP_{suffix}", "password": "password123"}
        data_fasilitas = {"id_fasilitas": f"LAB-CONF-{suffix}", "nama_fasilitas": "Laboratorium Riset Citra Digital", "kapasitas": 20, "lokasi": "FMIPA Lt. 2"}

        # =========================================================================
        # LANGKAH 1: Registrasi Semua User Berperan Penting
        # =========================================================================
        res_mhs1 = await ac.post("/auth/register", json=data_mhs1)
        assert res_mhs1.status_code == 201
        mhs1_id = res_mhs1.json()["id"]

        res_mhs2 = await ac.post("/auth/register", json=data_mhs2)
        assert res_mhs2.status_code == 201
        mhs2_id = res_mhs2.json()["id"]

        res_tendik = await ac.post("/auth/register", json=data_tendik)
        assert res_tendik.status_code == 201
        tendik_id = res_tendik.json()["id"]

        # =========================================================================
        # LANGKAH 2: Daftarkan Fasilitas Laboratorium Baru
        # =========================================================================
        res_fas = await ac.post("/fasilitas/", json=data_fasilitas)
        assert res_fas.status_code == 200
        fas_id = res_fas.json()["id_fasilitas"]

        # =========================================================================
        # LANGKAH 3: Mahasiswa 1 Mengajukan Booking (Status Awal: Pending)
        # =========================================================================
        payload_booking1 = {
            "fasilitas_id": fas_id,
            "tanggal": "2026-06-01",
            "jam": "09:00:00",
            "keperluan": "Penelitian Skripsi Komputer Visi",
            "mahasiswa_id": mhs1_id
        }
        res_book1 = await ac.post("/bookings/", json=payload_booking1)
        assert res_book1.status_code == 201
        assert res_book1.json()["status"] == "Pending"
        booking1_id = res_book1.json()["id_booking"]

        # =========================================================================
        # LANGKAH 3b: Mahasiswa 2 Mengajukan Booking di Slot yang Sama Saat Status Mahasiswa 1 Masih Pending
        # =========================================================================
        payload_clash = {
            "fasilitas_id": fas_id,
            "tanggal": "2026-06-01",
            "jam": "09:00:00",
            "keperluan": "Belajar Kelompok Git & GitHub",
            "mahasiswa_id": mhs2_id
        }
        res_clash = await ac.post("/bookings/", json=payload_clash)
        assert res_clash.status_code == 201
        assert res_clash.json()["status"] == "Pending"
        booking_clash_id = res_clash.json()["id_booking"]

        # =========================================================================
        # LANGKAH 4: Tendik Menyetujui Booking Mahasiswa 1 (Status Berubah: Approved)
        # =========================================================================
        payload_approval = {
            "status": "Approved",
            "tendik_id": tendik_id
        }
        res_appr = await ac.put(f"/bookings/{booking1_id}/approval", json=payload_approval)
        assert res_appr.status_code == 200
        assert res_appr.json()["status"] == "Approved"

        # =========================================================================
        # LANGKAH 4b: Tendik Mencoba Menyetujui Booking Clash Mahasiswa 2 -> HARUS GAGAL (HTTP 400)
        # =========================================================================
        res_appr_clash = await ac.put(f"/bookings/{booking_clash_id}/approval", json=payload_approval)
        assert res_appr_clash.status_code == 400
        assert "sudah disetujui" in res_appr_clash.json()["detail"]

        # =========================================================================
        # LANGKAH 5: TES SINKRONISASI BENTROK (Mahasiswa 2 Booking di Waktu yang Sama Baru Masuk Antrian Langsung)
        # =========================================================================
        payload_booking2 = {
            "fasilitas_id": fas_id,
            "tanggal": "2026-06-01",
            "jam": "09:00:00",
            "keperluan": "Belajar kelompok Next.js",
            "mahasiswa_id": mhs2_id
        }
        res_book2 = await ac.post("/bookings/", json=payload_booking2)

        # Sistem harus mengembalikan HTTP 202 (Accepted) karena dialihkan ke antrian
        assert res_book2.status_code == 202
        
        response_data = res_book2.json()["detail"]
        assert response_data["status"] == "queued"
        assert response_data["nomor_antrian"] == 1
        assert response_data["fasilitas_id"] == fas_id

        # =========================================================================
        # LANGKAH 6: TES PEMELIHARAAN DIBLOKIR (Maintenance Block Verification)
        # =========================================================================
        # Daftarkan Fasilitas dengan Status "Maintenance"
        data_fas_maint = {
            "id_fasilitas": f"LAB-MAINT-{suffix}",
            "nama_fasilitas": "Laboratorium Pemeliharaan",
            "kapasitas": 10,
            "lokasi": "FMIPA Lt. 3",
            "status": "Maintenance",
            "fasilitas_pendukung": "AC, Proyektor"
        }
        res_fas_maint = await ac.post("/fasilitas/", json=data_fas_maint)
        assert res_fas_maint.status_code == 200
        fas_maint_id = res_fas_maint.json()["id_fasilitas"]

        # Ajukan Booking ke Ruang Maintenance (Harus diblokir, mengembalikan HTTP 400 Bad Request)
        payload_booking_maint = {
            "fasilitas_id": fas_maint_id,
            "tanggal": "2026-06-01",
            "jam": "09:00:00",
            "keperluan": "Praktikum Pemeliharaan",
            "mahasiswa_id": mhs1_id
        }
        res_book_maint = await ac.post("/bookings/", json=payload_booking_maint)
        assert res_book_maint.status_code == 400
        assert "Fasilitas sedang dalam maintenance" in res_book_maint.json()["detail"]