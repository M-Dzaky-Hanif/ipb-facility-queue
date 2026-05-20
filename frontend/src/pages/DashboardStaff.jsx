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

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white">
            <div className="print:hidden"><Navbar /></div>
            
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex justify-between items-end mb-8 print:hidden">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-900">Jadwal Operasional Fasilitas</h2>
                        <p className="text-sm text-slate-500">Persiapan teknis & validasi harian ruangan/laboratorium.</p>
                    </div>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            placeholder="Ketik ID Ruang/Lab..." 
                            value={searchFasilitas}
                            onChange={(e) => setSearchFasilitas(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <button 
                            onClick={handlePrint}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm"
                        >
                            🖨️ Cetak Jadwal
                        </button>
                    </div>
                </div>

                {/* Header khusus Print */}
                <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-4">
                    <h1 className="text-2xl font-bold">Jadwal Peminjaman Fasilitas Harian</h1>
                    <p>Institut Pertanian Bogor (Sistem Antrian & Validasi)</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-700">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
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
                                    <td colSpan="4" className="p-6 text-center text-slate-400">Belum ada jadwal yang disetujui.</td>
                                </tr>
                            ) : (
                                filteredJadwal.map((j) => (
                                    <tr key={j.id_booking} className="hover:bg-slate-50">
                                        <td className="p-4 font-bold text-indigo-700">{j.fasilitas_id}</td>
                                        <td className="p-4 font-medium">{j.tanggal} <span className="block text-xs text-slate-500">{j.jam}</span></td>
                                        <td className="p-4 text-xs">
                                            {j.keperluan}
                                            {j.alat_id && <span className="block mt-1 font-bold text-amber-600">+ Pinjam {j.jumlah_alat}x {j.alat_id}</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="w-6 h-6 border-2 border-slate-400 rounded-md mx-auto print:border-black print:border-2"></div>
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