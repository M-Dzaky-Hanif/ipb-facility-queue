import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';

export default function DashboardAdmin() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // State Kontrol Navigasi Internal Admin (Ditambah 'alat')
    const [activeTab, setActiveTab] = useState('pengolahan'); 
    
    // State Database
    const [stats, setStats] = useState({
        totalBookings: 0, approved: 0, pending: 0, rejected: 0, totalFasilitas: 0, fasilitasAktif: 0
    });
    const [bookings, setBookings] = useState([]);
    const [fasilitas, setFasilitas] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [alatList, setAlatList] = useState([]); // TAMBAHAN: State untuk nampung data Alat

    const fetchAdminData = useCallback(async () => {
        try {
            // TAMBAHAN: Masukin API /alat/ ke dalam antrian pengambilan data
            const [resBook, resFas, resUsers, resAlat] = await Promise.allSettled([
                API.get('/bookings/'),
                API.get('/fasilitas/'),
                API.get('/auth/users'),
                API.get('/alat/')
            ]);
            
            const bData = resBook.status === 'fulfilled' ? resBook.value.data : [];
            const fData = resFas.status === 'fulfilled' ? resFas.value.data : [];
            const uData = resUsers.status === 'fulfilled' ? resUsers.value.data : [];
            const aData = resAlat.status === 'fulfilled' ? resAlat.value.data : []; // Ekstrak data alat

            setBookings(bData);
            setFasilitas(fData);
            setUsersList(uData);
            setAlatList(aData); // Simpan ke state

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
    const [newFas, setNewFas] = useState({ id_fasilitas: '', nama_fasilitas: '', lokasi: '', kapasitas: '', status: 'Tersedia', fasilitas_pendukung: '' });

    // TAMBAHAN: Modal & State untuk Tambah Alat
    const [showAlatModal, setShowAlatModal] = useState(false);
    const [newAlat, setNewAlat] = useState({ id_alat: '', fasilitas_id: '', nama_alat: '', jumlah: '', lokasi: '', kondisi: 'Baik' });

    // STATES UNTUK EKSPOR LAPORAN & DYNAMIC STATUS
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportMonth, setExportMonth] = useState(''); // '' untuk Semua Bulan
    const [exportYear, setExportYear] = useState(new Date().getFullYear().toString());
    const [exportFasilitas, setExportFasilitas] = useState(''); // '' untuk Semua Fasilitas

    // 🔥 STATES BARU: Toast Notification, Search, & Confirm Dialog
    const [toast, setToast] = useState(null); // { message, type: 'success'|'error'|'warning' }
    const [fasSearchQuery, setFasSearchQuery] = useState('');
    const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm }

    // Helper: Show toast notification (auto-dismiss 3 detik)
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await API.post('/auth/users', newUser);
            setShowUserModal(false);
            setNewUser({ nama: '', email: '', password: '', role: 'mahasiswa' });
            fetchAdminData(); 
            showToast(`User "${newUser.nama}" berhasil ditambahkan ke sistem!`, 'success');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Gagal menambahkan user.', 'error');
        }
    };

    const handleAddFasilitas = async (e) => {
        e.preventDefault();
        try {
            await API.post('/fasilitas/', { ...newFas, kapasitas: parseInt(newFas.kapasitas) });
            setShowFasModal(false);
            setNewFas({ id_fasilitas: '', nama_fasilitas: '', lokasi: '', kapasitas: '', status: 'Tersedia', fasilitas_pendukung: '' });
            fetchAdminData(); 
            showToast(`Fasilitas "${newFas.nama_fasilitas}" berhasil ditambahkan!`, 'success');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Gagal menambahkan sarana.', 'error');
        }
    };

    const handleToggleFasilitasStatus = async (fas) => {
        const nextStatus = fas.status === 'Maintenance' ? 'Tersedia' : 'Maintenance';
        setConfirmDialog({
            title: `Ubah Status → ${nextStatus}`,
            message: `Yakin ingin mengubah status "${fas.nama_fasilitas}" ke ${nextStatus === 'Maintenance' ? '🔧 Maintenance' : '✅ Tersedia'}? ${nextStatus === 'Maintenance' ? 'Mahasiswa tidak akan bisa booking ruangan ini.' : 'Ruangan akan bisa dipesan kembali.'}`,
            onConfirm: async () => {
                try {
                    await API.put(`/fasilitas/${fas.id_fasilitas}`, {
                        id_fasilitas: fas.id_fasilitas,
                        nama_fasilitas: fas.nama_fasilitas,
                        kapasitas: fas.kapasitas,
                        lokasi: fas.lokasi,
                        status: nextStatus,
                        fasilitas_pendukung: fas.fasilitas_pendukung
                    });
                    fetchAdminData();
                    showToast(`Status ${fas.nama_fasilitas} berhasil diubah → ${nextStatus === 'Maintenance' ? '🔧 Maintenance' : '✅ Tersedia'}`, 'success');
                } catch (err) {
                    showToast(err.response?.data?.detail || 'Gagal mengubah status fasilitas.', 'error');
                }
                setConfirmDialog(null);
            }
        });
    };

    const handleDownloadCSV = () => {
        const filtered = bookings.filter(b => {
            if (!b.tanggal) return false;
            const bDate = new Date(b.tanggal);
            const matchesMonth = exportMonth === '' || bDate.getMonth() + 1 === parseInt(exportMonth);
            const matchesYear = exportYear === '' || bDate.getFullYear().toString() === exportYear;
            const matchesFas = exportFasilitas === '' || b.fasilitas_id === exportFasilitas;
            return matchesMonth && matchesYear && matchesFas;
        });

        if (filtered.length === 0) {
            showToast('Tidak ada transaksi peminjaman pada kriteria filter tersebut!', 'warning');
            return;
        }

        const headers = ["ID Booking", "ID Mahasiswa", "Nama Pemohon", "Fasilitas ID", "Nama Fasilitas", "Tanggal", "Jam", "Keperluan", "Status"];
        const rows = filtered.map(b => {
            const foundUser = usersList.find(u => u.id === b.mahasiswa_id);
            const foundFas = fasilitas.find(f => f.id_fasilitas === b.fasilitas_id);
            return [
                `BK-00${b.id_booking}`,
                b.mahasiswa_id,
                foundUser ? foundUser.nama : `User #${b.mahasiswa_id}`,
                b.fasilitas_id,
                foundFas ? foundFas.nama_fasilitas : `Fasilitas #${b.fasilitas_id}`,
                b.tanggal,
                b.jam,
                b.keperluan,
                b.status
            ];
        });

        const csvString = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `laporan_peminjaman_${exportYear}_${exportMonth || 'semua'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintPDF = () => {
        window.print();
    };

    // TAMBAHAN: Handler Fungsi Tambah Alat ke Backend
    const handleAddAlat = async (e) => {
        e.preventDefault();
        try {
            await API.post('/alat/', { ...newAlat, jumlah: parseInt(newAlat.jumlah) });
            setShowAlatModal(false);
            setNewAlat({ id_alat: '', fasilitas_id: '', nama_alat: '', jumlah: '', lokasi: '', kondisi: 'Baik' });
            fetchAdminData(); 
            showToast(`Alat "${newAlat.nama_alat}" berhasil ditambahkan!`, 'success');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Gagal menambahkan alat.', 'error');
        }
    };
    
    // =========================================
    // 📊 KALKULASI DATA REAL TREN BULANAN & CHART
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
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body {
                        background-color: white !important;
                        color: black !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 1.5cm;
                    }
                }
            `}} />
            
            <div className="print:hidden">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* SUB-NAVIGASI SEGMENTED TABS INTERNAL ADMIN */}
                <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit gap-1 mb-8 border border-slate-200">
                    <button
                        onClick={() => setActiveTab('pengolahan')}
                        className={`px-5 py-2 text-xs font-bold rounded-lg transition duration-150 cursor-pointer ${
                            ['pengolahan', 'users', 'fasilitas', 'alat'].includes(activeTab) 
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
                                        
                                        {/* TAMBAHAN: Tombol Manajemen Alat */}
                                        <button onClick={() => setActiveTab('alat')} className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition group cursor-pointer flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-slate-700 group-hover:text-indigo-700">🛠️ Manajemen Inventaris</h4>
                                                <p className="text-[10px] text-slate-400 mt-0.5">Kelola Alat & Barang Lab</p>
                                            </div>
                                            {alatList.length > 0 && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md">{alatList.length}</span>}
                                        </button>
                                    </div>
                                </div>

                                {/* TAMBAHAN: EKSPOR LAPORAN CARD */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">📊 Laporan & Ekspor</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-4">Unduh data transaksi peminjaman dalam format file CSV atau cetak dokumen PDF resmi (ber-kop surat IPB University).</p>
                                    <button 
                                        onClick={() => setShowExportModal(true)} 
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition duration-150 cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                                    >
                                        ⚙️ Konfigurasi & Cetak Laporan
                                    </button>
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
                        {/* KODE TABEL USERS (Tetap Sama) */}
                        {usersList.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                                Belum ada data user.
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
                            </div>
                        )}
                        {/* MODAL TAMBAH USER (Tetap Sama) */}
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

                {/* TAB MANAJEMEN FASILITAS */}
                {activeTab === 'fasilitas' && (
                    <div className="animate-fade-in bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-4 gap-4">
                            <div>
                                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                                    <button onClick={() => setActiveTab('pengolahan')} className="text-slate-400 hover:text-indigo-600 mr-2">←</button>
                                    Database Fasilitas
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Menampilkan <b className="text-indigo-600">{fasilitas.filter(f => {
                                    if (!fasSearchQuery) return true;
                                    const q = fasSearchQuery.toLowerCase();
                                    return f.nama_fasilitas?.toLowerCase().includes(q) || f.id_fasilitas?.toLowerCase().includes(q) || f.lokasi?.toLowerCase().includes(q);
                                }).length}</b> dari {fasilitas.length} fasilitas terdaftar.</p>
                            </div>
                            <div className="flex gap-2 items-center w-full sm:w-auto">
                                <input 
                                    type="text" 
                                    placeholder="🔍 Cari nama / ID..." 
                                    value={fasSearchQuery}
                                    onChange={(e) => setFasSearchQuery(e.target.value)}
                                    className="p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none flex-grow sm:w-52 transition"
                                />
                                <button 
                                    onClick={() => setShowFasModal(true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition whitespace-nowrap cursor-pointer">
                                    + Tambah Sarana
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="p-4">ID / Kode</th>
                                        <th className="p-4">Nama Sarana</th>
                                        <th className="p-4">Lokasi</th>
                                        <th className="p-4 text-center">Kapasitas</th>
                                        <th className="p-4">Fasilitas Pendukung</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-center">Aksi Cepat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fasilitas.filter(f => {
                                        if (!fasSearchQuery) return true;
                                        const q = fasSearchQuery.toLowerCase();
                                        return f.nama_fasilitas?.toLowerCase().includes(q) || f.id_fasilitas?.toLowerCase().includes(q) || f.lokasi?.toLowerCase().includes(q);
                                    }).map((f) => (
                                        <tr key={f.id_fasilitas} className="hover:bg-slate-50 transition">
                                            <td className="p-4 font-mono font-bold text-slate-400 text-xs">{f.id_fasilitas}</td>
                                            <td className="p-4 font-bold text-slate-800">{f.nama_fasilitas}</td>
                                            <td className="p-4 text-xs text-slate-500">{f.lokasi}</td>
                                            <td className="p-4 text-center font-bold text-indigo-600">{f.kapasitas}</td>
                                            <td className="p-4">
                                                {f.fasilitas_pendukung ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {f.fasilitas_pendukung.split(',').map((tag, i) => {
                                                            const name = tag.trim();
                                                            return (
                                                                <span key={i} className="text-[10px] inline-flex items-center px-1.5 py-0.5 bg-indigo-50 border border-indigo-100/40 rounded font-medium text-indigo-700">
                                                                    {name}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">None</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded border transition-all duration-300 ${
                                                    f.status === 'Maintenance' 
                                                        ? 'bg-slate-100 text-slate-600 border-slate-200' 
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                }`}>
                                                    {f.status === 'Maintenance' ? '🔧 Maintenance' : '🟢 Tersedia'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => handleToggleFasilitasStatus(f)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
                                                        f.status === 'Maintenance'
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                                                            : 'bg-slate-600 hover:bg-slate-700 text-white shadow-slate-100'
                                                    }`}
                                                >
                                                    {f.status === 'Maintenance' ? '✅ Set Active' : '🔧 Set Maintenance'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kapasitas Maksimal (Orang)</label>
                                                    <input required type="number" min="1" value={newFas.kapasitas} onChange={e=>setNewFas({...newFas, kapasitas: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status Awal</label>
                                                    <select value={newFas.status} onChange={e=>setNewFas({...newFas, status: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700">
                                                        <option value="Tersedia">🟢 Tersedia</option>
                                                        <option value="Maintenance">🔧 Maintenance</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Fasilitas Pendukung (Pisahkan Koma)</label>
                                                <input type="text" placeholder="Contoh: AC, Proyektor, Wifi, Papan Tulis" value={newFas.fasilitas_pendukung} onChange={e=>setNewFas({...newFas, fasilitas_pendukung: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
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

                {/* TAMBAHAN: TAB MANAJEMEN ALAT/INVENTARIS */}
                {activeTab === 'alat' && (
                    <div className="animate-fade-in bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                                    <button onClick={() => setActiveTab('pengolahan')} className="text-slate-400 hover:text-indigo-600 mr-2">←</button>
                                    Database Inventaris Alat
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Daftar semua alat yang tersedia di setiap fasilitas.</p>
                            </div>
                            <button 
                                onClick={() => setShowAlatModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition">
                                + Tambah Alat
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="p-4">ID Alat</th>
                                        <th className="p-4">Nama Alat</th>
                                        <th className="p-4">Lokasi / Fasilitas</th>
                                        <th className="p-4 text-center">Jumlah</th>
                                        <th className="p-4">Kondisi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {alatList.map((a) => (
                                        <tr key={a.id_alat} className="hover:bg-slate-50">
                                            <td className="p-4 font-mono font-bold text-slate-400 text-xs">{a.id_alat}</td>
                                            <td className="p-4 font-bold text-slate-800">{a.nama_alat}</td>
                                            <td className="p-4 text-xs text-slate-500">
                                                {a.lokasi} <br/>
                                                <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-1 rounded">{a.fasilitas_id}</span>
                                            </td>
                                            <td className="p-4 text-center font-bold text-slate-700">{a.jumlah}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    a.kondisi.toLowerCase() === 'baik' ? 'bg-emerald-100 text-emerald-700' : 
                                                    a.kondisi.toLowerCase() === 'rusak' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {a.kondisi}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* MODAL TAMBAH ALAT */}
                            {showAlatModal && (
                                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                                        <h3 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">🛠️ Tambah Inventaris Alat</h3>
                                        <form onSubmit={handleAddAlat} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ID Alat (Unik)</label>
                                                <input required type="text" placeholder="Contoh: ALT-PC-02" value={newAlat.id_alat} onChange={e=>setNewAlat({...newAlat, id_alat: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 font-mono uppercase" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Fasilitas / Lab</label>
                                                <select required value={newAlat.fasilitas_id} onChange={e=>setNewAlat({...newAlat, fasilitas_id: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20">
                                                    <option value="" disabled>-- Pilih Lokasi --</option>
                                                    {fasilitas.map(f => (
                                                        <option key={f.id_fasilitas} value={f.id_fasilitas}>{f.nama_fasilitas} ({f.id_fasilitas})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Alat</label>
                                                <input required type="text" placeholder="Contoh: PC Desktop Core i7" value={newAlat.nama_alat} onChange={e=>setNewAlat({...newAlat, nama_alat: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jumlah</label>
                                                    <input required type="number" min="1" value={newAlat.jumlah} onChange={e=>setNewAlat({...newAlat, jumlah: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 font-bold" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kondisi</label>
                                                    <select required value={newAlat.kondisi} onChange={e=>setNewAlat({...newAlat, kondisi: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20">
                                                        <option value="Baik">Baik</option>
                                                        <option value="Perlu Servis">Perlu Servis</option>
                                                        <option value="Rusak">Rusak</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Detail Lokasi (Opsional)</label>
                                                <input type="text" placeholder="Contoh: Lemari Kaca No 2" value={newAlat.lokasi} onChange={e=>setNewAlat({...newAlat, lokasi: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                                            </div>
                                            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                                                <button type="button" onClick={()=>setShowAlatModal(false)} className="px-4 py-2.5 text-sm text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition cursor-pointer">Batal</button>
                                                <button type="submit" className="px-4 py-2.5 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition cursor-pointer">Simpan Alat</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB PROFIL KHUSUS ROLE ADMIN (Tetap Sama) */}
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

            {/* MODAL EKSPOR LAPORAN CONSOLE (SCREEN ONLY) */}
            {showExportModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-extrabold text-slate-800 mb-2 flex items-center gap-2">📊 Ekspor Laporan Bulanan</h3>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">Pilih periode dan filter fasilitas untuk mengunduh CSV atau mencetak PDF ber-kop resmi IPB.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Tahun</label>
                                <select value={exportYear} onChange={e => setExportYear(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700">
                                    <option value="2026">2026</option>
                                    <option value="2025">2025</option>
                                    <option value="2024">2024</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Bulan</label>
                                <select value={exportMonth} onChange={e => setExportMonth(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700">
                                    <option value="">Semua Bulan</option>
                                    {monthNames.map((name, i) => (
                                        <option key={i} value={String(i + 1)}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Filter Sarana / Ruangan</label>
                                <select value={exportFasilitas} onChange={e => setExportFasilitas(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700">
                                    <option value="">Semua Fasilitas</option>
                                    {fasilitas.map(f => (
                                        <option key={f.id_fasilitas} value={f.id_fasilitas}>{f.nama_fasilitas} ({f.id_fasilitas})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-100">
                                <button 
                                    onClick={handleDownloadCSV}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition duration-150 cursor-pointer shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5"
                                >
                                    📥 Unduh CSV
                                </button>
                                <button 
                                    onClick={handlePrintPDF}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition duration-150 cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
                                >
                                    🖨️ Cetak PDF Resmi
                                </button>
                            </div>

                            <button 
                                type="button" 
                                onClick={() => setShowExportModal(false)} 
                                className="w-full mt-2 py-2.5 text-xs text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition cursor-pointer text-center"
                            >
                                Tutup Pengaturan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRINT ONLY SECTION - LAPORAN KOP SURAT IPB */}
            <div className="hidden print:block bg-white text-black p-8 font-serif leading-relaxed text-sm">
                {/* Kop Surat Resmi IPB */}
                <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6">
                    <div className="relative w-20 h-20 shrink-0">
                        <img 
                            src="/logo-ipb.png" 
                            alt="Logo IPB" 
                            className="w-20 h-20 object-contain hidden"
                            onLoad={(e) => {
                                e.target.classList.remove('hidden');
                                const fallbackEl = document.getElementById('ipb-fallback-logo');
                                if (fallbackEl) fallbackEl.classList.add('hidden');
                            }}
                            onError={(e) => {
                                // Keep fallback visible, do nothing
                            }}
                        />
                        <div 
                            id="ipb-fallback-logo" 
                            className="absolute inset-0 w-20 h-20 bg-indigo-900 rounded-full flex items-center justify-center text-white text-xl font-bold font-sans"
                        >
                            IPB
                        </div>
                    </div>
                    <div className="flex-1 text-center font-bold font-sans">
                        <h4 className="text-sm tracking-wide">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</h4>
                        <h3 className="text-lg font-black">INSTITUT PERTANIAN BOGOR (IPB UNIVERSITY)</h3>
                        <h4 className="text-xs uppercase text-slate-700 mt-0.5">DIREKTORAT PRASARANA, SARANA, DAN ALAT PERKULIAHAN</h4>
                        <p className="text-[10px] font-normal text-slate-500 mt-1">Kampus IPB Dramaga, Kabupaten Bogor, Jawa Barat 16680</p>
                        <p className="text-[10px] font-normal text-slate-500">Email: sarpras@apps.ipb.ac.id | Telp: (0251) 8622642</p>
                    </div>
                    <div className="w-20"></div> {/* Spacer for center alignment */}
                </div>

                <div className="text-center font-bold mb-6 font-serif">
                    <h3 className="text-base underline uppercase tracking-wide font-black">LAPORAN BULANAN PEMINJAMAN FASILITAS & SARANA KAMPUS</h3>
                    <p className="text-xs mt-1 font-medium">Periode: {exportMonth ? `${monthNames[parseInt(exportMonth) - 1]} ${exportYear}` : `Tahun ${exportYear}`} {exportFasilitas && `• Fasilitas: ${exportFasilitas}`}</p>
                </div>

                {/* Ringkasan Statistik */}
                <div className="grid grid-cols-4 gap-4 mb-6 text-center font-sans">
                    <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Total Pengajuan</p>
                        <p className="text-lg font-black text-slate-800">{
                            bookings.filter(b => {
                                if (!b.tanggal) return false;
                                const bDate = new Date(b.tanggal);
                                const matchesMonth = exportMonth === '' || bDate.getMonth() + 1 === parseInt(exportMonth);
                                const matchesYear = exportYear === '' || bDate.getFullYear().toString() === exportYear;
                                const matchesFas = exportFasilitas === '' || b.fasilitas_id === exportFasilitas;
                                return matchesMonth && matchesYear && matchesFas;
                            }).length
                        } Tiket</p>
                    </div>
                    <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Disetujui</p>
                        <p className="text-lg font-black text-emerald-700">{
                            bookings.filter(b => {
                                if (!b.tanggal) return false;
                                const bDate = new Date(b.tanggal);
                                const matchesMonth = exportMonth === '' || bDate.getMonth() + 1 === parseInt(exportMonth);
                                const matchesYear = exportYear === '' || bDate.getFullYear().toString() === exportYear;
                                const matchesFas = exportFasilitas === '' || b.fasilitas_id === exportFasilitas;
                                return matchesMonth && matchesYear && matchesFas && b.status?.toUpperCase() === 'APPROVED';
                            }).length
                        } Tiket</p>
                    </div>
                    <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Ditolak</p>
                        <p className="text-lg font-black text-rose-700">{
                            bookings.filter(b => {
                                if (!b.tanggal) return false;
                                const bDate = new Date(b.tanggal);
                                const matchesMonth = exportMonth === '' || bDate.getMonth() + 1 === parseInt(exportMonth);
                                const matchesYear = exportYear === '' || bDate.getFullYear().toString() === exportYear;
                                const matchesFas = exportFasilitas === '' || b.fasilitas_id === exportFasilitas;
                                return matchesMonth && matchesYear && matchesFas && b.status?.toUpperCase() === 'REJECTED';
                            }).length
                        } Tiket</p>
                    </div>
                    <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Menunggu</p>
                        <p className="text-lg font-black text-amber-600">{
                            bookings.filter(b => {
                                if (!b.tanggal) return false;
                                const bDate = new Date(b.tanggal);
                                const matchesMonth = exportMonth === '' || bDate.getMonth() + 1 === parseInt(exportMonth);
                                const matchesYear = exportYear === '' || bDate.getFullYear().toString() === exportYear;
                                const matchesFas = exportFasilitas === '' || b.fasilitas_id === exportFasilitas;
                                return matchesMonth && matchesYear && matchesFas && b.status?.toUpperCase() === 'PENDING';
                            }).length
                        } Tiket</p>
                    </div>
                </div>

                {/* Table Laporan */}
                <table className="w-full text-left border-collapse border border-slate-400 text-xs mb-8">
                    <thead>
                        <tr className="bg-slate-100 font-sans font-bold">
                            <th className="border border-slate-400 p-2 text-center w-8">No</th>
                            <th className="border border-slate-400 p-2">ID Booking</th>
                            <th className="border border-slate-400 p-2">Pemohon (Mahasiswa)</th>
                            <th className="border border-slate-400 p-2">Fasilitas / Lab</th>
                            <th className="border border-slate-400 p-2 text-center font-mono">Tanggal</th>
                            <th className="border border-slate-400 p-2 text-center font-mono">Jam</th>
                            <th className="border border-slate-400 p-2">Keperluan</th>
                            <th className="border border-slate-400 p-2 text-center w-16">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.filter(b => {
                            if (!b.tanggal) return false;
                            const bDate = new Date(b.tanggal);
                            const matchesMonth = exportMonth === '' || bDate.getMonth() + 1 === parseInt(exportMonth);
                            const matchesYear = exportYear === '' || bDate.getFullYear().toString() === exportYear;
                            const matchesFas = exportFasilitas === '' || b.fasilitas_id === exportFasilitas;
                            return matchesMonth && matchesYear && matchesFas;
                        }).length === 0 ? (
                            <tr>
                                <td colSpan="8" className="border border-slate-400 p-4 text-center text-slate-400 italic">Tidak ada transaksi peminjaman terdaftar pada kriteria periode ini.</td>
                            </tr>
                        ) : (
                            bookings.filter(b => {
                                if (!b.tanggal) return false;
                                const bDate = new Date(b.tanggal);
                                const matchesMonth = exportMonth === '' || bDate.getMonth() + 1 === parseInt(exportMonth);
                                const matchesYear = exportYear === '' || bDate.getFullYear().toString() === exportYear;
                                const matchesFas = exportFasilitas === '' || b.fasilitas_id === exportFasilitas;
                                return matchesMonth && matchesYear && matchesFas;
                            }).map((b, idx) => {
                                const foundUser = usersList.find(u => u.id === b.mahasiswa_id);
                                const foundFas = fasilitas.find(f => f.id_fasilitas === b.fasilitas_id);
                                return (
                                    <tr key={b.id_booking}>
                                        <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                                        <td className="border border-slate-400 p-2 font-mono font-bold">BK-00{b.id_booking}</td>
                                        <td className="border border-slate-400 p-2 font-bold">{foundUser ? foundUser.nama : `User #${b.mahasiswa_id}`}</td>
                                        <td className="border border-slate-400 p-2">{foundFas ? foundFas.nama_fasilitas : b.fasilitas_id}</td>
                                        <td className="border border-slate-400 p-2 text-center font-mono">{b.tanggal}</td>
                                        <td className="border border-slate-400 p-2 text-center font-mono">{b.jam}</td>
                                        <td className="border border-slate-400 p-2 truncate max-w-[150px]">{b.keperluan}</td>
                                        <td className="border border-slate-400 p-2 text-center font-sans font-bold uppercase text-[10px]">
                                            <span className={
                                                b.status?.toUpperCase() === 'APPROVED' ? 'text-green-700' :
                                                b.status?.toUpperCase() === 'REJECTED' ? 'text-red-700' : 'text-amber-600'
                                            }>{b.status}</span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Bagian Tanda Tangan */}
                <div className="flex justify-between mt-12 px-6 font-sans">
                    <div>
                        <p className="text-[10px] text-slate-400">Dokumen Sistem Otomatis Valid</p>
                        <p className="text-[10px] text-slate-400">Keamanan Server IPB Verified</p>
                    </div>
                    <div className="text-center w-64">
                        <p>Bogor, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                        <p className="font-bold mt-1">Kepala Direktorat Sarana & Prasarana</p>
                        <p className="font-bold font-sans">IPB University</p>
                        <div className="h-16 flex items-center justify-center">
                            <span className="text-[10px] text-slate-300 italic border border-slate-200 px-3 py-1 rounded">E-Signature Autentik</span>
                        </div>
                        <p className="font-bold underline">Dr. Ir. H. Sarpras IPB, M.Si.</p>
                        <p className="text-xs text-slate-500 font-mono font-bold">NIP. 197508182003121002</p>
                    </div>
                </div>
            </div>

            {/* 🔥 TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[100] max-w-sm animate-[slideUp_0.3s_ease-out] ${
                    toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-amber-500'
                } text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold`}>
                    <span className="text-lg">{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}</span>
                    <span className="flex-1">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="text-white/70 hover:text-white text-lg font-bold cursor-pointer">×</button>
                </div>
            )}

            {/* 🔥 CONFIRMATION DIALOG MODAL */}
            {confirmDialog && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[90] p-4 animate-fade-in print:hidden">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-extrabold text-slate-800 mb-2">{confirmDialog.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">{confirmDialog.message}</p>
                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => setConfirmDialog(null)} 
                                className="px-4 py-2.5 text-sm text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={confirmDialog.onConfirm} 
                                className="px-4 py-2.5 text-sm bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transition cursor-pointer"
                            >
                                Ya, Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}