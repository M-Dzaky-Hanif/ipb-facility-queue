import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';

export default function DashboardMhs() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myBookings, setMyBookings] = useState([]);

    useEffect(() => {
        if (!user) navigate('/login', { replace: true });
    }, [user, navigate]);

    const fetchMyHistory = useCallback(async () => {
        try {
            if (user?.id) {
                const res = await API.get(`/bookings/mahasiswa/${user.id}`);
                setMyBookings(res.data);
            }
        } catch (err) {
            console.error("Gagal memuat histori transaksi:", err);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user) fetchMyHistory();
    }, [fetchMyHistory, user]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
                
                {/* RINGKASAN DATA PROFIL USER */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold uppercase">
                        {user.nama?.substring(0, 2)}
                    </div>
                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl font-extrabold text-slate-900">{user.nama}</h2>
                        <p className="text-sm font-semibold text-indigo-600 uppercase mt-0.5 tracking-wider">{user.role}</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-slate-500 font-medium">
                            <span>📧 {user.email}</span>
                            {user.nim && <span>🆔 NIM: <span className="font-mono font-bold">{user.nim}</span></span>}
                        </div>
                    </div>
                </div>

                {/* HISTORI STATUS DAFTAR ANTRIAN */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Riwayat Pengajuan & Antrian Anda</h3>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="p-3 rounded-l-lg">Fasilitas</th>
                                    <th className="p-3">Jadwal Pelaksanaan</th>
                                    <th className="p-3 text-center rounded-r-lg">Status Kelayakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {myBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-6 text-center text-slate-400 font-medium">Belum ada riwayat pengajuan peminjaman dilakukan.</td>
                                    </tr>
                                ) : (
                                    myBookings.map((b) => (
                                        <tr key={b.id_booking} className="hover:bg-slate-50/30">
                                            <td className="p-3 font-semibold text-slate-800">{b.fasilitas_id}</td>
                                            <td className="p-3 text-xs">
                                                {b.tanggal} <span className="block text-slate-400 mt-0.5">{b.jam}</span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md border ${
                                                    b.status?.toUpperCase() === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    b.status?.toUpperCase() === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>{b.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}