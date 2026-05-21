import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';

export default function DashboardAdmin() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // State Kontrol Navigasi Internal Admin
    const [activeTab, setActiveTab] = useState('pengolahan'); // Pilihan: 'pengolahan', 'profil', 'users', 'fasilitas'
    
    // State Database
    const [stats, setStats] = useState({
        totalBookings: 0, approved: 0, pending: 0, rejected: 0, totalFasilitas: 0, fasilitasAktif: 0
    });
    const [bookings, setBookings] = useState([]);
    const [fasilitas, setFasilitas] = useState([]);
    const [usersList, setUsersList] = useState([]);

    const fetchAdminData = useCallback(async () => {
        try {
            // Gunakan Promise.allSettled agar jika API '/users/' belum ada, data lain tetap muncul
            const [resBook, resFas, resUsers] = await Promise.allSettled([
                API.get('/bookings/'),
                API.get('/fasilitas/'),
                API.get('/auth/users')
            ]);
            
            // Ekstrak data hanya jika API sukses (fulfilled)
            const bData = resBook.status === 'fulfilled' ? resBook.value.data : [];
            const fData = resFas.status === 'fulfilled' ? resFas.value.data : [];
            const uData = resUsers.status === 'fulfilled' ? resUsers.value.data : [];

            setBookings(bData);
            setFasilitas(fData);
            setUsersList(uData);

            const approved = bData.filter(b => b.status?.toUpperCase() === 'APPROVED').length;
            const pending = bData.filter(b => b.status?.toUpperCase() === 'PENDING').length;
            const rejected = bData.filter(b => b.status?.toUpperCase() === 'REJECTED').length;
            const uniqueFasilitasBooked = new Set(bData.map(b => b.fasilitas_id)).size;

            setStats({
                totalBookings: bData.length,
                approved, pending, rejected,
                totalFasilitas: fData.length,
                fasilitasAktif: uniqueFasilitasBooked
            });
            
        } catch (err) {
            console.error("Gagal memuat analitik admin:", err);
        }
    }, []);

    useEffect(() => {
        if (!user) navigate('/login', { replace: true });
        else fetchAdminData();
    }, [fetchAdminData, user, navigate]);

    if (!user) return null;

    const utilitasPersen = stats.totalFasilitas > 0 
        ? Math.round((stats.fasilitasAktif / stats.totalFasilitas) * 100) : 0;

    // =========================================
    // STATE & HANDLER UNTUK MODAL FORM
    // =========================================
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ nama: '', email: '', password: '', role: 'mahasiswa' });

    const [showFasModal, setShowFasModal] = useState(false);
    const [newFas, setNewFas] = useState({ id_fasilitas: '', nama_fasilitas: '', lokasi: '', kapasitas: '' });

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await API.post('/auth/users', newUser);
            setShowUserModal(false);
            setNewUser({ nama: '', email: '', password: '', role: 'mahasiswa' });
            fetchAdminData(); // Refresh tabel seketika
            alert("✅ User berhasil ditambahkan ke sistem!");
        } catch (err) {
            alert(err.response?.data?.detail || "Gagal menambahkan user.");
        }
    };

    const handleAddFasilitas = async (e) => {
        e.preventDefault();
        try {
            // Konversi string ke angka untuk kapasitas
            await API.post('/fasilitas/', { ...newFas, kapasitas: parseInt(newFas.kapasitas) });
            setShowFasModal(false);
            setNewFas({ id_fasilitas: '', nama_fasilitas: '', lokasi: '', kapasitas: '' });
            fetchAdminData(); // Refresh tabel seketika
            alert("✅ Sarana Fasilitas berhasil ditambahkan!");
        } catch (err) {
            alert(err.response?.data?.detail || "Gagal menambahkan sarana.");
        }
    };
    
        // =========================================
    // 📊 KALKULASI DATA REAL TREN BULANAN
    // =========================================
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const monthsCount = Array(12).fill(0);
    bookings.forEach(b => {
        if (b.tanggal) {
            const d = new Date(b.tanggal);
            monthsCount[d.getMonth()] += 1;
        }
    });
    const maxMonthCount = Math.max(...monthsCount, 1);

    // =========================================
    // 🍩 KALKULASI PIE CHART FASILITAS (Top 4 + Lainnya)
    // =========================================
    const facilityCounts = bookings.reduce((acc, curr) => {
        if(curr.fasilitas_id) acc[curr.fasilitas_id] = (acc[curr.fasilitas_id] || 0) + 1;
        return acc;
    }, {});
    
    const sortedFas = Object.entries(facilityCounts).sort((a,b) => b[1] - a[1]);
    const totalFasBookings = sortedFas.reduce((sum, item) => sum + item[1], 0) || 1; 
    
    let cumulativePercent = 0;
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#64748b'];
    const pieData = sortedFas.slice(0, 4).map((item, index) => {
       const percent = (item[1] / totalFasBookings) * 100;
       const data = { id: item[0], count: item[1], percent, start: cumulativePercent, color: colors[index] };
       cumulativePercent += percent;
       return data;
    });
    
    if(sortedFas.length > 4) {
       const restCount = sortedFas.slice(4).reduce((sum, item) => sum + item[1], 0);
       const percent = (restCount / totalFasBookings) * 100;
       pieData.push({ id: 'Lainnya', count: restCount, percent, start: cumulativePercent, color: colors[4] });
    }
    
    const conicString = pieData.map(p => `${p.color} ${p.start}% ${p.start + p.percent}%`).join(', ');

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* SUB-NAVIGASI SEGMENTED TABS INTERNAL ADMIN */}
                <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit gap-1 mb-8 border border-slate-200">
                    <button
                        onClick={() => setActiveTab('pengolahan')}
                        className={`px-5 py-2 text-xs font-bold rounded-lg transition duration-150 cursor-pointer ${
                            ['pengolahan', 'users', 'fasilitas'].includes(activeTab) 
                                ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        📊 Pengolahan Data
                    </button>
                    <button
                        onClick={() => setActiveTab('profil')}
                        className={`px-5 py-2 text-xs font-bold rounded-lg transition duration-150 cursor-pointer ${
                            activeTab === 'profil' 
                                ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        👤 Profil Kontroler
                    </button>
                </div>

                {/* TAB PENGOLAHAN DATA (UTAMA) */}
                {activeTab === 'pengolahan' && (
                    <div className="animate-fade-in">
                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold text-slate-900">Pengolahan Data</h2>
                            <p className="text-sm text-slate-500">Memonitor tren peminjaman dan mengolah master data sistem.</p>
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
                            {/* TREN PEMINJAMAN REAL */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Tren Peminjaman Bulanan</h3>
                                <div className="flex items-end h-48 gap-2 sm:gap-4 px-2 flex-grow">
                                    {monthsCount.map((count, idx) => {
                                        const heightPercent = maxMonthCount > 0 ? (count / maxMonthCount) * 100 : 0;
                                        return (
                                            <div key={idx} className="w-full flex flex-col items-center group relative h-full justify-end">
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                                                    {count} Tiket
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-t-md relative overflow-hidden transition-all duration-500 h-full">
                                                    <div className="absolute bottom-0 w-full bg-indigo-500 group-hover:bg-indigo-400 transition-colors" style={{ height: `${heightPercent}%` }}></div>
                                                </div>
                                                <span className="text-[10px] sm:text-xs text-slate-400 font-bold mt-2">{monthNames[idx]}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex flex-col space-y-8">
                                {/* MANAJEMEN DATA KRUSIAL */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Akses Master Data</h3>
                                    <div className="space-y-3">
                                        <button onClick={() => setActiveTab('users')} className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition group cursor-pointer flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-slate-700 group-hover:text-indigo-700">👥 Manajemen Users</h4>
                                                <p className="text-[10px] text-slate-400 mt-0.5">Kelola Akun & Hak Akses</p>
                                            </div>
                                            {usersList.length > 0 && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md">{usersList.length}</span>}
                                        </button>
                                        <button onClick={() => setActiveTab('fasilitas')} className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition group cursor-pointer flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-slate-700 group-hover:text-indigo-700">🏢 Manajemen Fasilitas</h4>
                                                <p className="text-[10px] text-slate-400 mt-0.5">Kelola Ruang & Lab</p>
                                            </div>
                                            {fasilitas.length > 0 && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md">{fasilitas.length}</span>}
                                        </button>
                                    </div>
                                </div>

                                {/* PIE CHART FASILITAS */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Fasilitas Paling Laris</h3>
                                    <div className="flex flex-col items-center justify-center mt-6">
                                        {pieData.length > 0 ? (
                                            <div className="relative w-36 h-36 rounded-full shadow-inner mb-6 transition-transform hover:scale-105" 
                                                 style={{ background: `conic-gradient(${conicString})` }}>
                                                <div className="absolute inset-0 m-auto w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                                                    <span className="text-xl font-black text-slate-800">{totalFasBookings}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-36 h-36 rounded-full border-4 border-dashed border-slate-200 flex flex-col items-center justify-center mb-6 text-slate-400 text-xs">Belum ada</div>
                                        )}
                                        
                                        <div className="w-full grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                                            {pieData.map((p, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }}></div>
                                                    <span className="text-slate-600 font-semibold truncate" title={p.id}>{p.id}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB MANAJEMEN USERS */}
                {activeTab === 'users' && (
                    <div className="animate-fade-in bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                                    <button onClick={() => setActiveTab('pengolahan')} className="text-slate-400 hover:text-indigo-600 mr-2">←</button>
                                    Manajemen Users
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Mengawasi dan memodifikasi data akun terdaftar.</p>
                            </div>
                            <button 
                                onClick={() => setShowUserModal(true)} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition cursor-pointer">
                                + Tambah User
                            </button>
                        </div>
                        {usersList.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                                API Endpoint untuk Get All Users belum dikonfigurasi di Backend.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-700">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="p-4">Nama Lengkap</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Role Sistem</th>
                                            <th className="p-4 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {usersList.map((u) => (
                                            <tr key={u.id} className="hover:bg-slate-50">
                                                <td className="p-4 font-bold text-slate-800">{u.nama}</td>
                                                <td className="p-4 text-xs">{u.email}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{u.role}</span>
                                                </td>
                                                <td className="p-4 text-center space-x-3">
                                                    <button className="text-indigo-600 hover:text-indigo-800 font-bold text-xs">Edit</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {/* ================= MODAL UI: TAMBAH USER ================= */}
                                {showUserModal && (
                                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                                            <h3 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">👥 Tambah User Baru</h3>
                                            <form onSubmit={handleAddUser} className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Lengkap</label>
                                                    <input required type="text" value={newUser.nama} onChange={e=>setNewUser({...newUser, nama: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</label>
                                                    <input required type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Password Default</label>
                                                    <input required type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Role Sistem</label>
                                                    <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20">
                                                        <option value="mahasiswa">Mahasiswa</option>
                                                        <option value="tendik">Tendik</option>
                                                        <option value="staff_ruang">Staff Ruang</option>
                                                        <option value="admin">Admin System</option>
                                                    </select>
                                                </div>
                                                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                                                    <button type="button" onClick={()=>setShowUserModal(false)} className="px-4 py-2.5 text-sm text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition cursor-pointer">Batal</button>
                                                    <button type="submit" className="px-4 py-2.5 text-sm bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transition cursor-pointer">Simpan Akun</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB MANAJEMEN FASILITAS */}
                {activeTab === 'fasilitas' && (
                    <div className="animate-fade-in bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                                    <button onClick={() => setActiveTab('pengolahan')} className="text-slate-400 hover:text-indigo-600 mr-2">←</button>
                                    Database Fasilitas
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Daftar ruangan dan laboratorium yang tersedia.</p>
                            </div>
                            <button 
                                onClick={() => setShowFasModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition">
                                + Tambah Sarana
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="p-4">ID / Kode</th>
                                        <th className="p-4">Nama Sarana</th>
                                        <th className="p-4">Lokasi</th>
                                        <th className="p-4 text-center">Kapasitas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fasilitas.map((f) => (
                                        <tr key={f.id_fasilitas} className="hover:bg-slate-50">
                                            <td className="p-4 font-mono font-bold text-slate-400 text-xs">{f.id_fasilitas}</td>
                                            <td className="p-4 font-bold text-slate-800">{f.nama_fasilitas}</td>
                                            <td className="p-4 text-xs text-slate-500">{f.lokasi}</td>
                                            <td className="p-4 text-center font-bold text-indigo-600">{f.kapasitas}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* ================= MODAL UI: TAMBAH FASILITAS ================= */}
                            {showFasModal && (
                                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                                        <h3 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">🏢 Tambah Sarana / Ruangan</h3>
                                        <form onSubmit={handleAddFasilitas} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kode ID (Harus Unik)</label>
                                                <input required type="text" placeholder="Contoh: RK-CCR3" value={newFas.id_fasilitas} onChange={e=>setNewFas({...newFas, id_fasilitas: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono uppercase" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Sarana</label>
                                                <input required type="text" placeholder="Contoh: Ruang Kuliah CCR 3" value={newFas.nama_fasilitas} onChange={e=>setNewFas({...newFas, nama_fasilitas: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Lokasi / Gedung</label>
                                                <input required type="text" placeholder="Contoh: Gedung CCR Lantai 2" value={newFas.lokasi} onChange={e=>setNewFas({...newFas, lokasi: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kapasitas Maksimal (Orang)</label>
                                                <input required type="number" min="1" value={newFas.kapasitas} onChange={e=>setNewFas({...newFas, kapasitas: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700" />
                                            </div>
                                            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                                                <button type="button" onClick={()=>setShowFasModal(false)} className="px-4 py-2.5 text-sm text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition cursor-pointer">Batal</button>
                                                <button type="submit" className="px-4 py-2.5 text-sm bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md transition cursor-pointer">Simpan Sarana</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB PROFIL KHUSUS ROLE ADMIN */}
                {activeTab === 'profil' && (
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