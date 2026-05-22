import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';

export default function DashboardStaff() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jadwal, setJadwal] = useState([]);
    const [searchFasilitas, setSearchFasilitas] = useState('');

    const fetchJadwal = useCallback(async () => {
        try {
            const res = await API.get('/bookings/');
            // Staff HANYA melihat jadwal yang sudah disetujui (Approved) untuk disiapkan
            const approvedSchedules = res.data.filter(b => b.status?.toUpperCase() === 'APPROVED');
            setJadwal(approvedSchedules);
        } catch (err) {
            console.error("Gagal memuat jadwal:", err);
        }
    }, []);

    useEffect(() => {
        if (!user) navigate('/login', { replace: true });
        else fetchJadwal();
    }, [fetchJadwal, user, navigate]);

    // Fitur Filter Jadwal untuk Staff
    const filteredJadwal = jadwal.filter(j => 
        j.fasilitas_id?.toLowerCase().includes(searchFasilitas.toLowerCase())
    );

    // Fitur Cetak Dokumen (Sesuai Use Case PDF)
    const handlePrint = () => {
        window.print();
    };

    if (!user) return null;

    // Hitung ringkasan statistik operasional
    const totalJadwal = filteredJadwal.length;
    const uniqueRooms = new Set(filteredJadwal.map(j => j.fasilitas_id).filter(Boolean)).size;
    const totalAlat = filteredJadwal.reduce((acc, j) => acc + (j.jumlah_alat || 0), 0);

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white">
            <div className="print:hidden"><Navbar /></div>
            
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 print:hidden">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-900">Jadwal Operasional Fasilitas</h2>
                        <p className="text-sm text-slate-500">Persiapan teknis & validasi harian ruangan/laboratorium.</p>
                    </div>
                    <div className="flex gap-3">
                        <input 
                            type="text" 
                            placeholder="Cari Ruang/Lab..." 
                            value={searchFasilitas}
                            onChange={(e) => setSearchFasilitas(e.target.value)}
                            className="p-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition w-full sm:w-60 shadow-xs"
                        />
                        <button 
                            onClick={handlePrint}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-100 transition cursor-pointer shrink-0 flex items-center gap-2 text-sm"
                        >
                            🖨️ Cetak Jadwal
                        </button>
                    </div>
                </div>

                {/* STATS CARDS (Hidden on print) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
                    <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-xs">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Jadwal Aktif</div>
                        <div className="text-3xl font-extrabold text-slate-800 mt-2">{totalJadwal}</div>
                        <div className="text-xs text-indigo-600 font-bold mt-1.5">Peminjaman terverifikasi</div>
                    </div>
                    <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-xs">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Lab/Ruang Digunakan</div>
                        <div className="text-3xl font-extrabold text-slate-800 mt-2">{uniqueRooms}</div>
                        <div className="text-xs text-indigo-600 font-bold mt-1.5">Lokasi operasional aktif</div>
                    </div>
                    <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-xs">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Alat Perlu Disiapkan</div>
                        <div className="text-3xl font-extrabold text-slate-800 mt-2">{totalAlat}</div>
                        <div className="text-xs text-amber-600 font-bold mt-1.5">Aset/peralatan tambahan</div>
                    </div>
                </div>

                {/* Header khusus Print */}
                <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-4">
                    <h1 className="text-2xl font-bold">Jadwal Peminjaman Fasilitas Harian</h1>
                    <p className="text-sm text-slate-600">Institut Pertanian Bogor (Sistem Antrian & Validasi)</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xs border border-slate-200/60 overflow-hidden print:border-none print:shadow-none">
                    <table className="w-full text-left text-sm text-slate-700">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Fasilitas / Lab</th>
                                <th className="p-4">Waktu Mulai</th>
                                <th className="p-4">Tujuan / Alat Tambahan</th>
                                <th className="p-4 text-center">Status Validasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredJadwal.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-6 text-center text-slate-400 font-medium">Belum ada jadwal yang disetujui.</td>
                                </tr>
                            ) : (
                                filteredJadwal.map((j) => (
                                    <tr key={j.id_booking} className="hover:bg-slate-50/40 transition">
                                        <td className="p-4 font-extrabold text-indigo-600">{j.fasilitas_id}</td>
                                        <td className="p-4 font-semibold text-slate-800">{j.tanggal} <span className="block text-xs text-slate-400 mt-0.5 font-normal">{j.jam}</span></td>
                                        <td className="p-4 text-xs text-slate-500 leading-relaxed max-w-sm whitespace-pre-line">
                                            <span className="font-medium text-slate-700">{j.keperluan}</span>
                                            {j.alat_id && <span className="block mt-1.5 font-bold text-amber-600">+ Pinjam {j.jumlah_alat}x {j.alat_id}</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="w-6 h-6 border-2 border-slate-300 rounded-lg mx-auto print:border-black print:border-2 transition-colors duration-200 hover:border-indigo-400"></div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}