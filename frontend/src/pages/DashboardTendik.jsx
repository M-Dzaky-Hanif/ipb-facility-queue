import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function DashboardTendik() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');

    const fetchAllBookings = useCallback(async () => {
        try {
            const res = await API.get('/bookings/');
            // Saring pengajuan yang berstatus PENDING untuk di-review
            setBookings(res.data.filter(b => b.status?.toUpperCase() === 'PENDING'));
        } catch (err) {
            console.error("Gagal memuat list booking:", err);
            setError("Gagal mengambil data transaksi pendaftaran.");
        }
    }, []);

    // HOOK 1: Ambil data booking hanya jika user sedang aktif login
    useEffect(() => {
        if (user) {
            fetchAllBookings();
        }
    }, [fetchAllBookings, user]);

    // HOOK 2: DETEKSI LOGOUT (Ini fungsi sakti yang sebelumnya tertinggal)
    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    const handleAction = async (id_booking, statusAction) => {
        try {
            await API.put(`/bookings/${id_booking}/approval`, {
                status: statusAction, // 'Approved' atau 'Rejected'
                tendik_id: user.id
            });
            fetchAllBookings(); // Muat ulang data secara real-time
        } catch (err) {
            alert("Gagal memperbarui status transaksi.");
        }
    };

    // EARLY RETURN: Di posisi yang benar (setelah semua Hooks dideklarasikan)
    if (!user) {
        return null; 
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Konsol Evaluasi Peminjaman</h2>
                        <p className="text-sm text-slate-500">Daftar permintaan persetujuan penggunaan ruang fasilitas & laboratorium IPB</p>
                    </div>

                    {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="p-3 rounded-l-lg">ID Booking</th>
                                    <th className="p-3">Fasilitas</th>
                                    <th className="p-3">Waktu Pelaksanaan</th>
                                    <th className="p-3">Tujuan Penggunaan</th>
                                    <th className="p-3 rounded-r-lg text-center">Aksi Keputusan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-6 text-center text-slate-400 font-medium">
                                            Bersih! Tidak ada antrian pengajuan peminjaman baru saat ini.
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.map((b) => (
                                        <tr key={b.id_booking} className="hover:bg-slate-50/40 transition">
                                            <td className="p-3 font-semibold text-indigo-600">#BK-00{b.id_booking}</td>
                                            <td className="p-3 text-slate-800 font-medium">{b.fasilitas_id}</td>
                                            <td className="p-3 text-xs text-slate-600 font-medium">
                                                {b.tanggal} <span className="block text-slate-400">{b.jam}</span>
                                            </td>
                                            <td className="p-3 text-slate-500 max-w-sm">{b.keperluan}</td>
                                            <td className="p-3 flex justify-center space-x-2">
                                                <button 
                                                    onClick={() => handleAction(b.id_booking, 'Approved')}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg transition duration-150 cursor-pointer shadow-xs shadow-green-100"
                                                >
                                                    Setujui
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(b.id_booking, 'Rejected')}
                                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-lg transition duration-150 cursor-pointer"
                                                >
                                                    Tolak
                                                </button>
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