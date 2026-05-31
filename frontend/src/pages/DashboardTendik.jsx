import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';

export default function DashboardTendik() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const prevPendingIdsRef = useRef(null);
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [toast, setToast] = useState(null);
    
    // State Kontrol Navigasi Sub-Tab Internal Tendik
    const [activeTab, setActiveTab] = useState('evaluasi'); // Opsi: 'evaluasi', 'antrian', atau 'profil'

    // State untuk Manajemen Antrian
    const [fasilitasList, setFasilitasList] = useState([]);
    const [selectedFasilitas, setSelectedFasilitas] = useState('');
    const [queueData, setQueueData] = useState([]);

    const fetchFasilitas = async () => {
        try {
            const res = await API.get('/fasilitas/');
            setFasilitasList(res.data);
            if (res.data.length > 0) setSelectedFasilitas(res.data[0].id_fasilitas);
        } catch (err) {
            console.error("Gagal memuat list fasilitas", err);
        }
    };

    const fetchQueueForFacility = async (fasId) => {
        if (!fasId) return;
        try {
            const res = await API.get(`/queues/facility/${fasId}`);
            setQueueData(res.data);
        } catch (err) {
            console.error("Gagal memuat antrian fasilitas", err);
        }
    };

    useEffect(() => {
        if (activeTab === 'antrian') {
            fetchQueueForFacility(selectedFasilitas);
        }
    }, [activeTab, selectedFasilitas]);

    const handleCallNext = async () => {
        try {
            await API.post(`/queues/facility/${selectedFasilitas}/next`);
            fetchQueueForFacility(selectedFasilitas);
        } catch (err) {
            alert(err.response?.data?.detail || "Gagal memanggil antrian.");
        }
    };

    // State untuk Konfirmasi Evaluasi
    const [showActionConfirm, setShowActionConfirm] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // { id_booking, statusAction }

    // State untuk Ubah Password Profil Tendik
    const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '' });
    const [pwdSuccess, setPwdSuccess] = useState('');
    const [pwdError, setPwdError] = useState('');

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwdSuccess('');
        setPwdError('');
        try {
            await API.put(`/auth/users/${user.id}/change-password`, pwdForm);
            setPwdSuccess("Password berhasil diperbarui! ✅");
            setPwdForm({ old_password: '', new_password: '' });
        } catch (err) {
            setPwdError(err.response?.data?.detail || "Gagal memperbarui password.");
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAllBookings = useCallback(async () => {
        try {
            const res = await API.get('/bookings/');
            const allBookings = res.data;
            
            const pendingBookings = allBookings.filter(b => b.status?.toUpperCase() === 'PENDING');
            const pending = pendingBookings.length;
            const approved = allBookings.filter(b => b.status?.toUpperCase() === 'APPROVED').length;
            const rejected = allBookings.filter(b => b.status?.toUpperCase() === 'REJECTED').length;
            
            setStats({ pending, approved, rejected });
            setBookings(pendingBookings);

            const pendingIds = pendingBookings.map(b => b.id_booking);
            if (prevPendingIdsRef.current !== null) {
                const newBookings = pendingBookings.filter(b => !prevPendingIdsRef.current.includes(b.id_booking));
                if (newBookings.length > 0) {
                    newBookings.forEach(b => {
                        showToast(`Ada pengajuan baru masuk: #BK-00${b.id_booking} (${b.fasilitas_id})! 🔔`, 'info');
                    });
                    try {
                        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
                        audio.volume = 0.4;
                        audio.play();
                    } catch (e) {
                        console.log("Audio autoplay blocked by browser policy");
                    }
                }
            }
            prevPendingIdsRef.current = pendingIds;
        } catch (err) {
            console.error("Gagal memuat list booking:", err);
            setError("Gagal mengambil data transaksi pendaftaran.");
            showToast("Gagal mengambil data pendaftaran.", "error");
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchAllBookings();
            fetchFasilitas();
            const interval = setInterval(fetchAllBookings, 8000); // Polling setiap 8 detik
            return () => clearInterval(interval);
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
                        onClick={() => setActiveTab('antrian')}
                        className={`px-5 py-2 text-xs font-bold rounded-lg transition duration-150 cursor-pointer ${
                            activeTab === 'antrian' 
                                ? 'bg-white text-indigo-600 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        🚦 Manajemen Antrian
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
                ) : activeTab === 'antrian' ? (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Manajemen Antrian Fasilitas</h2>
                                <p className="text-sm text-slate-500">Panggil antrian mahasiswa secara real-time</p>
                            </div>
                            <select 
                                value={selectedFasilitas} 
                                onChange={(e) => setSelectedFasilitas(e.target.value)}
                                className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                {fasilitasList.map(f => (
                                    <option key={f.id_fasilitas} value={f.id_fasilitas}>{f.id_fasilitas} - {f.nama_fasilitas}</option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-6 mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Status Antrian Saat Ini</h3>
                                    <p className="text-2xl font-black text-indigo-950">
                                        {queueData.length} <span className="text-lg text-slate-500 font-medium">Orang Menunggu</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={handleCallNext}
                                    disabled={queueData.length === 0}
                                    className={`px-6 py-3 rounded-xl font-bold shadow-md transition-all duration-300 ${queueData.length > 0 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    📢 Panggil Berikutnya
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="p-3 rounded-l-lg">No. Antrian</th>
                                        <th className="p-3">ID Mahasiswa</th>
                                        <th className="p-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {queueData.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="p-6 text-center text-slate-400 font-medium">
                                                Tidak ada antrian aktif di fasilitas ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        queueData.map((q, index) => (
                                            <tr key={q.id_queue} className={`transition ${index === 0 ? 'bg-indigo-50/40' : 'hover:bg-slate-50/40'}`}>
                                                <td className="p-3 font-black text-indigo-600 text-lg">#{q.nomor_antrian}</td>
                                                <td className="p-3 text-slate-800 font-bold">{q.mahasiswa_id}</td>
                                                <td className="p-3 text-center">
                                                    {index === 0 ? (
                                                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold shadow-sm animate-pulse">Menunggu Giliran Utama</span>
                                                    ) : (
                                                        <span className="text-slate-400 font-medium">Menunggu</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
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

                        {/* 🔥 SECTION UBAH PASSWORD */}
                        <div className="border-t border-slate-100 p-6 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                🔑 Ubah Password Akun
                            </h3>
                            {pwdSuccess && <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-100">{pwdSuccess}</div>}
                            {pwdError && <div className="p-3 mb-4 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl border border-rose-100">{pwdError}</div>}
                            
                            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Password Lama</label>
                                    <input 
                                        type="password" 
                                        required 
                                        value={pwdForm.old_password}
                                        onChange={e => setPwdForm(prev => ({...prev, old_password: e.target.value}))}
                                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Password Baru</label>
                                    <input 
                                        type="password" 
                                        required 
                                        value={pwdForm.new_password}
                                        onChange={e => setPwdForm(prev => ({...prev, new_password: e.target.value}))}
                                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition duration-150 cursor-pointer shadow-xs shadow-indigo-100"
                                >
                                    Perbarui Password
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* 🔥 TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl animate-fade-in ${
                    toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : toast.type === 'info' ? 'bg-indigo-600 shadow-indigo-100' : 'bg-amber-500'
                }`}>
                    <span className="text-lg">{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'info' ? '🔔' : '⚠️'}</span>
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