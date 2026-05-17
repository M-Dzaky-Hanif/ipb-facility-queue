# IPB Campus Facility & Queue System

Aplikasi Full-Stack berbasis web untuk mengelola peminjaman fasilitas dan laboratorium akademik di lingkungan IPB University. Sistem ini dilengkapi dengan fitur **Sinkronisasi Antrian Otomatis (Automated Queue System)** asinkron yang secara cerdas akan mengalihkan mahasiswa ke daftar antrian jika jadwal ruang yang diajukan telah terisi (`Approved`).

---

## 🚀 Fitur Utama
- **Manajemen Fasilitas & Alat:** Pengelolaan data ruangan dan inventaris alat akademik di dalamnya (Agregasi).
- **Autentikasi Multi-Role:** Pemisahan hak akses dinamis untuk Mahasiswa, Tendik, Admin, dan Staff Ruang dengan enkripsi `bcrypt`.
- **Sistem Booking Cerdas:** Validasi otomatis jadwal bentrok pada jam dan tanggal yang sama.
- **Sistem Antrian Real-time:** Pengalihan otomatis pendaftaran bentrok menjadi nomor antrian aktif.
- **Otomatisasi Notifikasi:** Pengiriman baris pesan riwayat status persetujuan langsung ke database mahasiswa terkait.
- **Automated Integration Testing:** Dilengkapi dengan uji coba skenario otomatis menggunakan `pytest` dan `httpx`.

---

## 🛠️ Tech Stack

### Backend
- **Core Framework:** FastAPI (Python 3.14+)
- **Database ORM:** SQLAlchemy (Asynchronous Mode)
- **Database Driver:** `asyncpg` + PostgreSQL
- **Data Validation:** Pydantic v2
- **Testing Tools:** Pytest, Pytest-asyncio, HTTPX (ASGITransport)

### Frontend
- **Library Utama:** React.js (Vite Bundle)
- **Styling Framework:** Tailwind CSS v4
- **HTTP Client:** Axios
- **Routing:** React Router DOM v6
- **State Management:** React Context API (Auth Provider)

---

## 📁 Struktur Direktori Proyek

```text
ipb-facility-queue/
├── backend/
│   ├── app/
│   │   ├── crud/         # Logika Transaksi Database (Booking, Queue, User)
│   │   ├── models/       # Model Tabel SQLAlchemy (PostgreSQL)
│   │   ├── routers/      # API Endpoints (FastAPI Routers)
│   │   ├── schemas/      # Validasi Skema Pydantic v2
│   │   └── database.py   # Konfigurasi Engine Async Session
│   ├── tests/            # Berkas Uji Coba Otomatis (Pytest)
│   ├── pytest.ini        # Konfigurasi PythonPath & Mode Async
│   └── requirements.txt  # Daftar Library Python Backend
└── frontend/
    ├── src/
    │   ├── api/          # Konfigurasi Axios Instance
    │   ├── components/   # Komponen Reusable (Navbar)
    │   ├── context/      # State Global Session Login (AuthContext)
    │   ├── pages/        # Halaman Utama (Login, Register, Dashboard)
    │   ├── App.jsx       # Konfigurasi React Router DOM
    │   └── main.css      # Entry Point Tailwind CSS v4
    └── vite.config.js    # Konfigurasi Build & Plugin Tailwind v4
```

⚙️ Langkah Setup & Cara Menjalankan Aplikasi
Pastikan kamu sudah menginstal Python 3.14+, Node.js (LTS), dan PostgreSQL di laptopmu sebelum memulai.

1. Kloning Repositori
```bash
git clone [https://github.com/M-Dzaky-Hanif/ipb-facility-queue.git](https://github.com/M-Dzaky-Hanif/ipb-facility-queue.git)
cd ipb-facility-queue
```

2. Setup dan Jalankan Backend (FastAPI)
Buka terminal baru, lalu masuk ke direktori `backend`:
```bash
cd backend
```

Buat dan aktifkan Virtual Environment (`venv`):
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```
Instal seluruh dependencies library Python:
```bash
pip install -r requirements.txt
```

Konfigurasi Environment Variable (`.env`):
Buat file bernama `.env` di dalam folder `backend/` dan sesuaikan URL database PostgreSQL lokal milikmu:
```bash
DATABASE_URL=postgresql+asyncpg://username_postgres:password_kamu@localhost:5432/nama_database_kamu
```

Jalankan server lokal Backend:
```bash
uvicorn app.main:app --reload
```

Backend akan berjalan di alamat: `http://localhost:8000` dan dokumentasi Swagger UI dapat diakses di `http://localhost:8000/docs`.

3. Setup dan Jalankan Frontend (React + Tailwind v4)
Buka tab terminal baru tanpa mematikan terminal backend, lalu masuk ke direktori `frontend`:
```bash
cd frontend
```

Instal seluruh modul Node.js yang diperlukan:
```bash
npm install
```

Jalankan server lokal Frontend:
```bash
npm run dev
```

Frontend React akan berjalan di alamat: `http://localhost:5173/`.

🧪 Cara Menjalankan Uji Coba Otomatis (Testing)
Aplikasi ini sudah dilengkapi dengan berkas pengujian skenario jadwal bentrok otomatis untuk memvalidasi fungsi auto-queue.

Untuk menjalankan pengujian, pastikan virtual environment (`venv`) backend kamu dalam keadaan aktif, lalu eksekusi perintah berikut di dalam folder `backend`:
```bash
python -m pytest -v tests/test_booking_conflict.py
```
