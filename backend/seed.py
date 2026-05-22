import asyncio
from sqlalchemy import text
from passlib.context import CryptContext
from app.database import engine, AsyncSessionLocal, Base
from app.models.user import User, UserRole
from app.models.fasilitas import Fasilitas, Alat
from app.models.booking import Booking
from app.models.queue import Queue
from app.models.notifikasi import Notifikasi

# Konfigurasi Hashing Password yang mandiri (standalone)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def seed_data():
    print("Membangun ulang skema database...")
    
    # =========================================================
    # 🚨 BAGIAN KRUSIAL BARU: Hapus tabel lama & buat yang baru
    # =========================================================
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        try:
            print("Menghapus data lama dari database (jika ada)...")
            await session.execute(text("TRUNCATE TABLE alat, fasilitas, bookings, queues, notifikasi, users RESTART IDENTITY CASCADE"))
            await session.commit()
            print("Data lama berhasil dibersihkan!\n")

            # ==========================================
            # 1. SEED DATA USER
            # ==========================================
            print("[SEED] Menambahkan data Users...")
            default_password = get_password_hash("password123")
            
            users = [
                # Mahasiswa (5)
                User(nama="Dzaky Hanif", email="mhs1@apps.ipb.ac.id", password=default_password, role=UserRole.MAHASISWA, nim="G6401201001"),
                User(nama="Budi Santoso", email="mhs2@apps.ipb.ac.id", password=default_password, role=UserRole.MAHASISWA, nim="G6401201002"),
                User(nama="Siti Aminah", email="mhs3@apps.ipb.ac.id", password=default_password, role=UserRole.MAHASISWA, nim="G6401201003"),
                User(nama="Andi Wijaya", email="mhs4@apps.ipb.ac.id", password=default_password, role=UserRole.MAHASISWA, nim="G6401201004"),
                User(nama="Rina Melati", email="mhs5@apps.ipb.ac.id", password=default_password, role=UserRole.MAHASISWA, nim="G6401201005"),
                
                # Tendik (2)
                User(nama="Pak Suratno", email="tendik1@apps.ipb.ac.id", password=default_password, role=UserRole.TENDIK, nip="198001012005011001"),
                User(nama="Ibu Ratih", email="tendik2@apps.ipb.ac.id", password=default_password, role=UserRole.TENDIK, nip="198001012005011002"),
                
                # Admin (2)
                User(nama="Admin Sistem Utama", email="admin1@apps.ipb.ac.id", password=default_password, role=UserRole.ADMIN, id_admin="ADM001"),
                User(nama="Admin Jaringan", email="admin2@apps.ipb.ac.id", password=default_password, role=UserRole.ADMIN, id_admin="ADM002"),
                
                # Staff Ruang (2)
                User(nama="Staff Gedung Kuliah", email="staff1@apps.ipb.ac.id", password=default_password, role=UserRole.STAFF, id_staff="STF001"),
                User(nama="Staff Laboratorium", email="staff2@apps.ipb.ac.id", password=default_password, role=UserRole.STAFF, id_staff="STF002"),
            ]
            session.add_all(users)
            await session.commit()

            # ==========================================
            # 2. SEED DATA FASILITAS (Ruang, Lab, Lapangan)
            # ==========================================
            print("[SEED] Menambahkan data Fasilitas...")
            fasilitas_data = [
                # Ruang Kelas
                Fasilitas(id_fasilitas="RK-CCR1", nama_fasilitas="Ruang Kelas CCR 1.01", kapasitas=100, lokasi="Gedung CCR Lt. 1", status="Tersedia", fasilitas_pendukung="AC, Proyektor, WiFi, Sound System, Papan Tulis"),
                Fasilitas(id_fasilitas="RK-CCR2", nama_fasilitas="Ruang Kelas CCR 1.02", kapasitas=100, lokasi="Gedung CCR Lt. 1", status="Tersedia", fasilitas_pendukung="AC, Proyektor, WiFi, Papan Tulis"),
                Fasilitas(id_fasilitas="RK-GKU1", nama_fasilitas="Auditorium GKU", kapasitas=300, lokasi="Gedung Kuliah Umum", status="Tersedia", fasilitas_pendukung="AC, Proyektor Panggung, Sound System, Mic Wireless, WiFi"),
                Fasilitas(id_fasilitas="RK-FAPERTA", nama_fasilitas="Ruang Seminar Faperta", kapasitas=50, lokasi="Fakultas Pertanian", status="Tersedia", fasilitas_pendukung="AC, Proyektor, WiFi, Whiteboard"),
                
                # Laboratorium
                Fasilitas(id_fasilitas="LAB-KOM1", nama_fasilitas="Laboratorium Komputer 1", kapasitas=40, lokasi="Departemen Ilmu Komputer Lt. 2", status="Tersedia", fasilitas_pendukung="AC, PC Desktop Core i7, LAN Gigabit, Proyektor, WiFi"),
                Fasilitas(id_fasilitas="LAB-BIO1", nama_fasilitas="Laboratorium Biologi Terpadu", kapasitas=30, lokasi="Fakultas MIPA Lt. 1", status="Maintenance", fasilitas_pendukung="AC, Mikroskop, Kulkas Spesimen, WiFi, Lemari Asam"),
                Fasilitas(id_fasilitas="LAB-KIM1", nama_fasilitas="Laboratorium Kimia Dasar", kapasitas=25, lokasi="Gedung Kimia", status="Tersedia", fasilitas_pendukung="AC, Lemari Asam, Tabung Reaksi Set, Alat Distilasi"),
                
                # Lapangan
                Fasilitas(id_fasilitas="LAP-GYM", nama_fasilitas="Gymnasium IPB", kapasitas=500, lokasi="Kawasan Olahraga Dramaga", status="Tersedia", fasilitas_pendukung="Tribun Penonton, Ring Basket, Net Voli, Lampu Sorot"),
                Fasilitas(id_fasilitas="LAP-GEL", nama_fasilitas="Stadion Gelora", kapasitas=1000, lokasi="Kawasan Olahraga Dramaga", status="Tersedia", fasilitas_pendukung="Lintasan Lari, Gawang Sepak Bola, Lampu Stadion, Tribun Utama"),
                Fasilitas(id_fasilitas="LAP-TNS", nama_fasilitas="Lapangan Tenis Outdoor", kapasitas=20, lokasi="Samping Gymnasium", status="Tersedia", fasilitas_pendukung="Net Tenis, Kursi Wasit, Lampu Lapangan"),
            ]
            session.add_all(fasilitas_data)
            await session.commit()

            # ==========================================
            # 3. SEED DATA ALAT
            # ==========================================
            print("[SEED] Menambahkan data Alat Inventaris...")
            alat_data = [
                # Alat di Ruang Kelas
                Alat(id_alat="ALT-PRJ-01", fasilitas_id="RK-CCR1", nama_alat="Proyektor Epson LCD", jumlah=2, lokasi="Lemari Kelas CCR1", kondisi="Baik"),
                Alat(id_alat="ALT-MIC-01", fasilitas_id="RK-CCR1", nama_alat="Wireless Microphone", jumlah=1, lokasi="Meja Dosen CCR1", kondisi="Baik"),
                Alat(id_alat="ALT-PRJ-02", fasilitas_id="RK-GKU1", nama_alat="Proyektor Besar Barco", jumlah=1, lokasi="Ruang Operator GKU", kondisi="Baik"),
                
                # Alat di Laboratorium Komputer
                Alat(id_alat="ALT-PC-01", fasilitas_id="LAB-KOM1", nama_alat="PC Desktop Lenovo (Core i7)", jumlah=40, lokasi="Meja Lab Komputer", kondisi="Baik"),
                Alat(id_alat="ALT-SRV-01", fasilitas_id="LAB-KOM1", nama_alat="Local Server Switch", jumlah=1, lokasi="Rak Server Lab", kondisi="Perlu Servis"),
                
                # Alat di Laboratorium Biologi/Kimia
                Alat(id_alat="ALT-MIK-01", fasilitas_id="LAB-BIO1", nama_alat="Mikroskop Binokuler", jumlah=15, lokasi="Lemari Kaca Lab Bio", kondisi="Baik"),
                Alat(id_alat="ALT-TBN-01", fasilitas_id="LAB-KIM1", nama_alat="Tabung Reaksi Set", jumlah=50, lokasi="Gudang Lab Kimia", kondisi="Baik"),
                
                # Alat di Lapangan
                Alat(id_alat="ALT-BSK-01", fasilitas_id="LAP-GYM", nama_alat="Bola Basket Spalding", jumlah=5, lokasi="Gudang Gymnasium", kondisi="Baik"),
                Alat(id_alat="ALT-NET-01", fasilitas_id="LAP-TNS", nama_alat="Net Tenis Portabel", jumlah=2, lokasi="Pinggir Lapangan Tenis", kondisi="Kurang Baik"),
            ]
            session.add_all(alat_data)
            await session.commit()

            print("\n[SUCCESS] Semua data dummy berhasil dimasukkan ke dalam database!")
            
        except Exception as e:
            print(f"\n[FAIL] SEEDING GAGAL! Berikut pesan errornya:\n{e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(seed_data())