import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';

export default function DashboardAdmin() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // State Kontrol Navigasi Sub-Tab Internal Admin
    const [activeTab, setActiveTab] = useState('analitik'); // Pilihan: 'analitik' atau 'profil'
    
    // State Data Analitik
    const [stats, setStats] = useState({
        totalBookings: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        totalFasilitas: 0,
        fasilitasAktif: 0
    });

    const fetchAnalytics = useCallback(async () => {
        try {
            const [resBook, resFas] = await Promise.all([
                API.get('/bookings/'),
                API.get('/fasilitas/')
            ]);
            
            const bookings = resBook.data;
            const fasilitas = resFas.data;

            const approved = bookings.filter(b => b.status?.toUpperCase() === 'APPROVED').length;
            const pending = bookings.filter(b => b.status?.toUpperCase() === 'PENDING').length;
            const rejected = bookings.filter(b => b.status?.toUpperCase() === 'REJECTED').length;
            
            const uniqueFasilitasBooked = new Set(bookings.map(b => b.fasilitas_id)).size;

            setStats({
                totalBookings: bookings.length,
                approved, pending, rejected,
                totalFasilitas: fasilitas.length,
                fasilitasAktif: uniqueFasilitasBooked
            });
        } catch (err) {
            console.error("Gagal memuat analitik admin:", err);
        }
    }, []);

    useEffect(() => {
        if (!user) navigate('/login', { replace: true });
        else fetchAnalytics();
    }, [fetchAnalytics, user, navigate]);

    if (!user) return null;

    const utilitasPersen = stats.totalFasilitas > 0 
        ? Math.round((stats.fasilitasAktif / stats.totalFasilitas) * 100) 
        : 0;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* SUB-NAVIGASI SEGMENTED TABS INTERNAL ADMIN */}
                <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit gap-1 mb-8 border border-slate-200">
                    <button
                        onClick={() => setActiveTab('analitik')}
                        className={`px-5 py-2 text-xs font-bold rounded-lg transition duration-150 cursor-pointer ${
                            activeTab === 'analitik' 
                                ? 'bg-white text-indigo-600 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        📊 Analitik & Kontrol
                    </button>
                    <button
                        onClick={() => setActiveTab('profil')}
                        className={`px-5 py-2 text-xs font-bold rounded-lg transition duration-150 cursor-pointer ${
                            activeTab === 'profil' 
                                ? 'bg-white text-indigo-600 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        👤 Profil Kontroler
                    </button>
                </div>

                {/* KONDISIONAL KONTEN BERDASARKAN TAB YANG AKTIF */}
                {activeTab === 'analitik' ? (
                    <>
                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold text-slate-900">Command Center Admin</h2>
                            <p className="text-sm text-slate-500">Memonitor tren peminjaman dan mengolah data krusial sistem.</p>
                        </div>

                        {/* KARTU STATISTIK (METRICS) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase">Total Pengajuan</p>
                                <h3 className="text-3xl font-black text-indigo-600 mt-2">{stats.totalBookings} <span className="text-sm font-medium text-slate-500">Tiket</span></h3>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase">Menunggu Validasi</p>
                                <h3 className="text-3xl font-black text-amber-500 mt-2">{stats.pending} <span className="text-sm font-medium text-slate-500">Antrian</span></h3>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase">Disetujui Tendik</p>
                                <h3 className="text-3xl font-black text-emerald-500 mt-2">{stats.approved} <span className="text-sm font-medium text-slate-500">Selesai</span></h3>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md text-white">
                                <p className="text-xs font-bold text-indigo-300 uppercase">Tingkat Utilitas Fasilitas</p>
                                <h3 className="text-3xl font-black mt-2">{utilitasPersen}% <span className="text-sm font-medium text-slate-400">Terpakai</span></h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* TREN PEMINJAMAN (Simulasi Bar Chart CSS) */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Tren Peminjaman Bulanan</h3>
                                <div className="flex items-end h-48 gap-4 px-2">
                                    {[40, 65, 30, 80, 50, 90, 75].map((height, idx) => (
                                        <div key={idx} className="w-full flex flex-col items-center group">
                                            <div className="w-full bg-indigo-100 rounded-t-md relative overflow-hidden transition-all duration-500" style={{ height: '100%' }}>
                                                <div className="absolute bottom-0 w-full bg-indigo-500 group-hover:bg-indigo-400 transition-colors" style={{ height: `${height}%` }}></div>
                                            </div>
                                            <span className="text-xs text-slate-400 font-bold mt-2">Bln {idx+1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* MANAJEMEN DATA KRUSIAL */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Pengolahan Data Krusial</h3>
                                <p className="text-xs text-slate-500 mb-6">Akses kontrol database utama sistem IPB Facility Queue.</p>
                                
                                <div className="space-y-3">
                                    <button className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition group cursor-pointer">
                                        <h4 className="font-bold text-slate-700 group-hover:text-indigo-700">👥 Manajemen Users</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Kelola data Mahasiswa, Tendik, Staff</p>
                                    </button>
                                    <button className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition group cursor-pointer">
                                        <h4 className="font-bold text-slate-700 group-hover:text-indigo-700">🏢 Manajemen Fasilitas</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Tambah/Hapus Ruangan & Lab</p>
                                    </button>
                                    <button className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition group cursor-pointer">
                                        <h4 className="font-bold text-slate-700 group-hover:text-indigo-700">🛠️ Manajemen Inventaris</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Update stok alat & kondisi</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* HALAMAN PROFIL KHUSUS ROLE ADMIN */
                    <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                        <div className="h-32 bg-gradient-to-r from-slate-900 to-indigo-950 flex items-end p-6 relative">
                            <div className="w-20 h-20 bg-amber-50 border-4 border-white rounded-xl shadow-sm flex items-center justify-center text-2xl font-bold text-amber-600 absolute -bottom-8 left-6 uppercase">
                                {user.nama?.substring(0, 2)}
                            </div>
                        </div>
                        <div className="pt-12 p-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-extrabold text-slate-900">{user.nama}</h2>
                                <span className="inline-block mt-1 px-2.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold rounded-md tracking-wider uppercase">
                                    🛡️ {user.role} ROOT SYSTEM
                                </span>
                            </div>

                            <div className="border-t border-slate-100 pt-5 space-y-4">
                                <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Admin</span>
                                    <span className="text-sm font-semibold text-slate-800 col-span-2">{user.email}</span>
                                </div>
                                {user.id_admin && (
                                    <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID Administrator</span>
                                        <span className="text-sm font-bold text-slate-800 col-span-2 font-mono">{user.id_admin}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat Enkripsi</span>
                                    <span className="text-sm font-semibold text-emerald-600 col-span-2">OAuth2 JWT Token Secure</span>
                                </div>
                                <div className="grid grid-cols-3 py-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Otoritas Database</span>
                                    <span className="text-sm font-medium text-slate-600 col-span-2">Modifikasi Master Data & Flush Cache Aktif</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}