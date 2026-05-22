import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';

export default function DashboardTendik() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [toast, setToast] = useState(null);
    
    // State Kontrol Navigasi Sub-Tab Internal Tendik
    const [activeTab, setActiveTab] = useState('evaluasi'); // Opsi: 'evaluasi' atau 'profil'

    // State untuk Konfirmasi Evaluasi
    const [showActionConfirm, setShowActionConfirm] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // { id_booking, statusAction }

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAllBookings = useCallback(async () => {
        try {
            const res = await API.get('/bookings/');
            const allBookings = res.data;
            
            const pending = allBookings.filter(b => b.status?.toUpperCase() === 'PENDING').length;
            const approved = allBookings.filter(b => b.status?.toUpperCase() === 'APPROVED').length;
            const rejected = allBookings.filter(b => b.status?.toUpperCase() === 'REJECTED').length;
            
            setStats({ pending, approved, rejected });
            setBookings(allBookings.filter(b => b.status?.toUpperCase() === 'PENDING'));
        } catch (err) {
            console.error("Gagal memuat list booking:", err);
            setError("Gagal mengambil data transaksi pendaftaran.");
            showToast("Gagal mengambil data pendaftaran.", "error");
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchAllBookings();
        }
    }, [fetchAllBookings, user]);

    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    const handleActionClick = (id_booking, statusAction) => {
        setPendingAction({ id_booking, statusAction });
        setShowActionConfirm(true);
    };

    const handleActionConfirm = async () => {
        if (!pendingAction) return;
        const { id_booking, statusAction } = pendingAction;
        setShowActionConfirm(false);
        setPendingAction(null);

        try {
            await API.put(`/bookings/${id_booking}/approval`, {
                status: statusAction,
                tendik_id: user.id
            });
            showToast(`Peminjaman #BK-00${id_booking} berhasil ${statusAction === 'Approved' ? 'disetujui! ✅' : 'ditolak! ❌'}`, 'success');
            fetchAllBookings();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Gagal memperbarui status transaksi.";
            showToast(errorMsg, "error");
        }
    };

    if (!user) {
        return null; 
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* SUB-NAVIGASI SEGMENTED TABS INTERNAL TENDIK */}
                <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit gap-1 mb-8 border border-slate-200">
                    <button
                        onClick={() => setActiveTab('evaluasi')}
                        className={`px-5 py-2 text-xs font-bold rounded-lg transition duration-150 cursor-pointer ${
                            activeTab === 'evaluasi' 
                                ? 'bg-white text-indigo-600 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        📋 Konsol Evaluasi
                    </button>
                    <button
                        onClick={() => setActiveTab('profil')}
                        className={`px-5 py-2 text-xs font-bold rounded-lg transition duration-150 cursor-pointer ${
                            activeTab === 'profil' 
                                ? 'bg-white text-indigo-600 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        👤 Profil Administrasi
                    </button>
                </div>

                {/* TAMPILAN KONTEN BERDASARKAN SELEKSI TAB */}
                {activeTab === 'evaluasi' ? (
                    <div className="space-y-8">
                        {/* STATS CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-md text-white">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-100">Menunggu Evaluasi</div>
                                <div className="text-3xl font-extrabold mt-2">{stats.pending}</div>
                                <div className="text-xs text-indigo-100/80 mt-1">Pengajuan peminjaman aktif</div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-md text-white">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">Disetujui Hari Ini</div>
                                <div className="text-3xl font-extrabold mt-2">{stats.approved}</div>
                                <div className="text-xs text-emerald-100/80 mt-1">Telah disetujui & divalidasi</div>
                            </div>
                            <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-2xl shadow-md text-white">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-rose-100">Ditolak / Batal</div>
                                <div className="text-3xl font-extrabold mt-2">{stats.rejected}</div>
                                <div className="text-xs text-rose-100/80 mt-1">Pengajuan ditolak</div>
                            </div>
                        </div>

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
                                                    <td className="p-3 text-slate-500 max-w-sm whitespace-pre-line">
                                                        {b.keperluan}
                                                        {b.alat_id && <span className="block mt-1 font-bold text-amber-600">+ Pinjam {b.jumlah_alat}x {b.alat_id}</span>}
                                                    </td>
                                                    <td className="p-3 flex justify-center space-x-2">
                                                        <button 
                                                            onClick={() => handleActionClick(b.id_booking, 'Approved')}
                                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-lg transition duration-150 cursor-pointer shadow-xs shadow-green-100"
                                                        >
                                                            Setujui
                                                        </button>
                                                        <button 
                                                            onClick={() => handleActionClick(b.id_booking, 'Rejected')}
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
                ) : (
                    /* PROFILE PAGE YANG BERBEDA KHUSUS UNTUK ROLE TENDIK */
                    <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-slate-800 to-indigo-950 flex items-end p-6 relative">
                            <div className="w-20 h-20 bg-indigo-50 border-4 border-white rounded-xl shadow-sm flex items-center justify-center text-2xl font-bold text-indigo-700 absolute -bottom-8 left-6 uppercase">
                                {user.nama?.substring(0, 2)}
                            </div>
                        </div>
                        <div className="pt-12 p-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-extrabold text-slate-900">{user.nama}</h2>
                                <span className="inline-block mt-1 px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-md tracking-wider uppercase">
                                    Staff {user.role}
                                </span>
                            </div>

                            <div className="border-t border-slate-100 pt-5 space-y-4">
                                <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Dinas</span>
                                    <span className="text-sm font-semibold text-slate-800 col-span-2">{user.email}</span>
                                </div>
                                {user.nip && (
                                    <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nomor Induk Pegawai</span>
                                        <span className="text-sm font-bold text-slate-800 col-span-2 font-mono">{user.nip}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Otoritas Dokumen</span>
                                    <span className="text-sm font-semibold text-emerald-600 col-span-2">Validator Utama Peminjaman Aset</span>
                                </div>
                                <div className="grid grid-cols-3 py-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hak Akses Modul</span>
                                    <span className="text-sm font-medium text-slate-600 col-span-2">Modul Antrian Konflik Jadwal Otomatis Aktif</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 🔥 TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl animate-fade-in ${
                    toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-amber-500'
                }`}>
                    <span className="text-lg">{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}</span>
                    <span className="flex-1 font-semibold text-sm">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="text-white/70 hover:text-white text-lg font-bold cursor-pointer">×</button>
                </div>
            )}

            {/* 🔥 CONFIRM MODAL UNTUK EVALUASI TENDIK */}
            <ConfirmModal 
                isOpen={showActionConfirm}
                title={pendingAction?.statusAction === 'Approved' ? "Setujui Peminjaman" : "Tolak Peminjaman"}
                message={`Apakah Anda yakin ingin ${pendingAction?.statusAction === 'Approved' ? 'menyetujui' : 'menolak'} pengajuan peminjaman #BK-00${pendingAction?.id_booking}?`}
                confirmText={pendingAction?.statusAction === 'Approved' ? "Ya, Setujui" : "Ya, Tolak"}
                cancelText="Batal"
                confirmColor={pendingAction?.statusAction === 'Approved' ? "indigo" : "rose"}
                onConfirm={handleActionConfirm}
                onCancel={() => {
                    setShowActionConfirm(false);
                    setPendingAction(null);
                }}
            />
        </div>
    );
}