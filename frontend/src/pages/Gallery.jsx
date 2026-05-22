import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';

export default function Gallery() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // States Utama Data & Filter
    const [fasilitas, setFasilitas] = useState([]);
    const [allAlat, setAllAlat] = useState([]);
    const [activeTab, setActiveTab] = useState('rekomendasi');
    const [searchQuery, setSearchQuery] = useState(''); // Search reguler (di dalam tab ruang/lab)
    const [fakultasFilter, setFakultasFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // 🔥 STATE BARU: Untuk Search Bar Besar di Tab Rekomendasi
    const [globalSearch, setGlobalSearch] = useState('');
    
    // States untuk Detail Panel Sisi Kanan
    const [selectedFas, setSelectedFas] = useState(null);
    const [alatDiRuangan, setAlatDiRuangan] = useState([]);
    
    // 🔥 STATES BARU: Untuk kalender mingguan & dynamic occupancy
    const [bookings, setBookings] = useState([]);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toLocaleDateString('en-CA'));

    useEffect(() => {
        if (!user) navigate('/login', { replace: true });
    }, [user, navigate]);

    const fetchData = useCallback(async () => {
        try {
            const [resFas, resAlat, resBook] = await Promise.all([
                API.get('/fasilitas/'),
                API.get('/alat/'),
                API.get('/bookings/')
            ]);
            
            const bData = resBook.data || [];
            setBookings(bData);
            
            const todayStr = new Date().toLocaleDateString('en-CA');
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            
            const getMinutes = (timeStr) => {
                if (!timeStr) return 0;
                const parts = timeStr.split(':');
                return parseInt(parts[0]) * 60 + parseInt(parts[1]);
            };
            
            const mappedFas = resFas.data.map((item, idx) => {
                let status_pinjam = 'Tersedia';
                if (item.status === 'Maintenance') {
                    status_pinjam = 'Maintenance';
                } else {
                    const hasActiveBooking = bData.some(b => {
                        return b.fasilitas_id === item.id_fasilitas && 
                               b.status === 'Approved' && 
                               b.tanggal === todayStr &&
                               currentMinutes >= getMinutes(b.jam) &&
                               currentMinutes < (getMinutes(b.jam) + 120);
                    });
                    if (hasActiveBooking) {
                        status_pinjam = 'Sedang Digunakan';
                    }
                }
                
                return {
                    ...item,
                    kategori: item.id_fasilitas?.toLowerCase().includes('lab') ? 'lab' : 
                              item.id_fasilitas?.toLowerCase().includes('lap') ? 'lapangan' : 'ruang',
                    fakultas: idx % 2 === 0 ? 'FMIPA' : idx % 3 === 0 ? 'SV' : 'FAPERTA',
                    status_pinjam,
                    isPopuler: idx % 2 === 0
                };
            });

            const mappedAlat = resAlat.data.map((alat, idx) => ({
                ...alat,
                kali_dipinjam: (idx + 1) * 12,
                isPopuler: (idx + 1) * 12 > 25
            }));

            setFasilitas(mappedFas);
            setAllAlat(mappedAlat);
        } catch (err) {
            console.error("Gagal memuat data katalog:", err);
        }
    }, []);

    useEffect(() => {
        if (user) fetchData();
    }, [fetchData, user]);

    useEffect(() => {
        if (selectedFas) {
            const bungkusanAlat = allAlat.filter(a => a.fasilitas_id === selectedFas.id_fasilitas);
            setAlatDiRuangan(bungkusanAlat);
        } else {
            setAlatDiRuangan([]);
        }
    }, [selectedFas, allAlat]);

    // Filter untuk Tab Reguler (Ruang / Lab / Lapangan)
    const filteredFasilitas = fasilitas.filter(item => {
        const matchesTab = item.kategori === activeTab;
        const matchesSearch = item.nama_fasilitas?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.id_fasilitas?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFakultas = fakultasFilter === '' || item.fakultas === fakultasFilter;
        const matchesStatus = statusFilter === '' || item.status_pinjam === statusFilter;
        return matchesTab && matchesSearch && matchesFakultas && matchesStatus;
    });

    // Konten Tab Rekomendasi (Default)
    const ruanganRekomendasi = fasilitas.filter(f => f.isPopuler);
    const alatRekomendasi = allAlat.filter(a => a.isPopuler).sort((a, b) => b.kali_dipinjam - a.kali_dipinjam);

    // 🔥 LOGIKA PENCARIAN GLOBAL
    const isSearchingGlobal = globalSearch.trim() !== '';
    const globalSearchFasilitas = fasilitas.filter(f => 
        f.nama_fasilitas?.toLowerCase().includes(globalSearch.toLowerCase()) || 
        f.id_fasilitas?.toLowerCase().includes(globalSearch.toLowerCase())
    );
    const globalSearchAlat = allAlat.filter(a => 
        a.nama_alat?.toLowerCase().includes(globalSearch.toLowerCase()) || 
        a.id_alat?.toLowerCase().includes(globalSearch.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <Navbar />
            
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white py-12 px-6 sm:px-12 shadow-inner">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Eksplorasi Fasilitas & Sarana Kampus</h1>
                    <p className="text-indigo-200 mt-2 text-sm sm:text-base max-w-2xl">
                        Sistem pengelolaan antrian peminjaman ruang kelas, laboratorium rekayasa, dan lapangan olahraga secara real-time.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                
                <div className="flex border-b border-slate-200 gap-2 mb-6 overflow-x-auto">
                    {['rekomendasi', 'ruang', 'lab', 'lapangan'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setSelectedFas(null); }}
                            className={`px-6 py-3 text-sm font-bold border-b-2 capitalize transition whitespace-nowrap cursor-pointer ${
                                activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab === 'rekomendasi' ? '⭐ Rekomendasi' : tab === 'lab' ? '🔬 Laboratorium' : tab === 'lapangan' ? '⚽ Lapangan' : '🏢 Ruang Kelas'}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    <div className="flex-grow">
                        {activeTab === 'rekomendasi' ? (
                            <div className="space-y-8">
                                
                                {/* 🔥 SEARCH BAR BESAR GLOBAL */}
                                <div className="relative group">
                                    <input 
                                        type="text" 
                                        placeholder="🔍 Ketik nama fasilitas, lab, lapangan, atau alat di sini..." 
                                        value={globalSearch}
                                        onChange={(e) => setGlobalSearch(e.target.value)}
                                        className="w-full p-4 pl-12 text-base font-medium border-2 border-slate-200 rounded-2xl shadow-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800 placeholder-slate-400"
                                    />
                                    <span className="absolute left-4 top-4 text-xl opacity-60 group-focus-within:text-indigo-600 group-focus-within:opacity-100 transition-colors">
                                        ⌘
                                    </span>
                                </div>

                                {/* KONDISIONAL RENDER: TAMPILKAN HASIL PENCARIAN ATAU DAFTAR POPULER */}
                                {isSearchingGlobal ? (
                                    <div className="space-y-8 animate-fade-in">
                                        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">
                                            Hasil Pencarian untuk: <span className="text-indigo-600">"{globalSearch}"</span>
                                        </h3>
                                        
                                        {/* Hasil Pencarian Ruang/Lab */}
                                        {globalSearchFasilitas.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">🏢 Sarana Ruang & Fasilitas</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {globalSearchFasilitas.map(fas => (
                                                        <div 
                                                            key={fas.id_fasilitas}
                                                            onClick={() => setSelectedFas(fas)}
                                                            className={`bg-white rounded-xl border p-4 shadow-xs hover:shadow-md transition cursor-pointer ${
                                                                selectedFas?.id_fasilitas === fas.id_fasilitas ? 'border-indigo-600 ring-2 ring-indigo-500/10' : 'border-slate-200/60'
                                                            }`}
                                                        >
                                                            <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-bold">{fas.id_fasilitas}</span>
                                                            <h4 className="text-base font-bold text-slate-800 mt-2 leading-snug">{fas.nama_fasilitas}</h4>
                                                            <p className="text-xs text-slate-400 mt-1">📍 {fas.lokasi}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Hasil Pencarian Alat */}
                                        {globalSearchAlat.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 mt-6">🛠️ Inventaris Alat</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    {globalSearchAlat.map(alat => (
                                                        <div key={alat.id_alat} className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-slate-800 mb-1">{alat.nama_alat}</h4>
                                                                <p className="text-[11px] text-slate-400">Lokasi: <span className="font-mono font-bold text-slate-500">{alat.fasilitas_id}</span></p>
                                                                <p className="text-[11px] text-slate-400 mt-0.5">Stok: <b className="text-slate-700">{alat.jumlah} Unit</b></p>
                                                            </div>
                                                            <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                                                                <button 
                                                                    onClick={() => {
                                                                        const induk = fasilitas.find(f => f.id_fasilitas === alat.fasilitas_id);
                                                                        navigate('/booking-alat', { state: { targetAlat: alat, indukFasilitas: induk } });
                                                                    }}
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg shadow-xs transition cursor-pointer text-xs w-full"
                                                                >
                                                                    Pinjam Alat
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Jika tidak ada hasil sama sekali */}
                                        {globalSearchFasilitas.length === 0 && globalSearchAlat.length === 0 && (
                                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 font-medium">
                                                Tidak menemukan fasilitas atau alat yang cocok dengan pencarian Anda.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* TAMPILAN DEFAULT REKOMENDASI JIKA SEARCH BAR KOSONG */
                                    <div className="space-y-10 animate-fade-in">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">🏢 Ruangan & Lab Terpopuler Bulan Ini</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                {ruanganRekomendasi.map(fas => (
                                                    <div 
                                                        key={fas.id_fasilitas}
                                                        onClick={() => setSelectedFas(fas)}
                                                        className={`bg-white rounded-xl border p-5 shadow-xs hover:shadow-md transition cursor-pointer relative overflow-hidden ${
                                                            selectedFas?.id_fasilitas === fas.id_fasilitas ? 'border-indigo-600 ring-2 ring-indigo-500/10' : 'border-slate-200/60'
                                                        }`}
                                                    >
                                                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-3 py-1 uppercase rounded-bl-lg tracking-wider">🔥 Ramai</div>
                                                        <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-bold">{fas.id_fasilitas}</span>
                                                        <h4 className="text-base font-bold text-slate-800 mt-2 leading-snug">{fas.nama_fasilitas}</h4>
                                                        <p className="text-xs text-slate-400 mt-1">📍 {fas.lokasi} • 👥 {fas.kapasitas} Mhs</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">🛠️ Alat & Inventaris Paling Sering Dicari</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                {alatRekomendasi.map(alat => (
                                                    <div key={alat.id_alat} className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-xs flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded uppercase tracking-wide">Aset Alat</span>
                                                                <span className="text-xs text-slate-400 font-medium">📦 Stok: {alat.jumlah}</span>
                                                            </div>
                                                            <h4 className="text-sm font-bold text-slate-800">{alat.nama_alat}</h4>
                                                            <p className="text-[11px] text-slate-400 mt-0.5">Induk Ruang: <span className="font-mono font-bold text-slate-500">{alat.fasilitas_id}</span></p>
                                                        </div>
                                                        <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                                                            <span className="text-[11px] text-slate-500 font-medium">Kondisi: <b className="text-emerald-600">{alat.kondisi}</b></span>
                                                            <button 
                                                                onClick={() => {
                                                                    const induk = fasilitas.find(f => f.id_fasilitas === alat.fasilitas_id);
                                                                    navigate('/booking-alat', { state: { targetAlat: alat, indukFasilitas: induk } });
                                                                }}
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-md shadow-xs transition cursor-pointer text-xs"
                                                            >
                                                                Pinjam
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* TAB REGULER (RUANG, LAB, LAPANGAN) KODENYA TETAP SAMA */
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
                                    <input 
                                        type="text" 
                                        placeholder="Cari nama atau ID fasilitas..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                                    />
                                    <select value={fakultasFilter} onChange={(e) => setFakultasFilter(e.target.value)} className="p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none">
                                        <option value="">Semua Fakultas / Sekolah</option>
                                        <option value="FMIPA">FMIPA (MIPA)</option>
                                        <option value="FAPERTA">FAPERTA (Pertanian)</option>
                                        <option value="SV">SV (Sekolah Vokasi)</option>
                                    </select>
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none">
                                        <option value="">Semua Status Pinjam</option>
                                        <option value="Tersedia">🟢 Tersedia</option>
                                        <option value="Sedang Digunakan">🔴 Sedang Digunakan</option>
                                        <option value="Maintenance">🔧 Maintenance</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {filteredFasilitas.length === 0 ? (
                                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400 font-medium">
                                            Tidak ada fasilitas yang cocok dengan kriteria filter Anda.
                                        </div>
                                    ) : (
                                        filteredFasilitas.map((fas) => (
                                            <div 
                                                key={fas.id_fasilitas} 
                                                onClick={() => setSelectedFas(fas)}
                                                className={`bg-white rounded-xl border p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between ${
                                                    selectedFas?.id_fasilitas === fas.id_fasilitas ? 'border-indigo-600 ring-2 ring-indigo-500/10' : 'border-slate-200/60'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-bold">{fas.id_fasilitas}</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border transition-all duration-300 ${
                                                            fas.status_pinjam === 'Tersedia' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            fas.status_pinjam === 'Sedang Digunakan' ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse' :
                                                            'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>{
                                                            fas.status_pinjam === 'Tersedia' ? '🟢 Tersedia' :
                                                            fas.status_pinjam === 'Sedang Digunakan' ? '🔴 Sedang Digunakan' :
                                                            '🔧 Maintenance'
                                                        }</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-800 leading-snug">{fas.nama_fasilitas}</h3>
                                                    <p className="text-sm text-slate-400 mt-1">📍 {fas.lokasi}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* SISI KANAN: PANEL DETIL INFORMASI */}
                    {selectedFas && (
                        <div id="detail-panel" className="w-full lg:w-96 bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-6 h-fit max-h-[calc(100vh-50px)] overflow-y-auto animate-[slideIn_0.3s_ease-out]">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Informasi Detail</h3>
                                <button onClick={() => setSelectedFas(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕ Close</button>
                            </div>
                            
                            <div className="space-y-3 mb-4">
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nama Sarana</p>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedFas.nama_fasilitas}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-[10px] text-slate-400 font-semibold">Gedung / Lokasi</p>
                                        <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedFas.lokasi}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-[10px] text-slate-400 font-semibold">Kapasitas</p>
                                        <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedFas.kapasitas} Orang</p>
                                    </div>
                                </div>
                            </div>

                            {/* FITUR 3: FASILITAS PENDUKUNG (AMENITIES) */}
                            <div className="mb-6">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">⚡ Fasilitas Pendukung (Amenities)</p>
                                {selectedFas.fasilitas_pendukung ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedFas.fasilitas_pendukung.split(',').map((item, idx) => {
                                            const name = item.trim();
                                            return (
                                                <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100/40 text-indigo-700 text-xs font-semibold">
                                                    {name}
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Spesifikasi belum dilengkapi.</p>
                                )}
                            </div>

                            {/* FITUR 3: PROTEKSI MAINTENANCE & BANNER WARNING */}
                            {selectedFas.status === 'Maintenance' ? (
                                <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-300 rounded-xl flex items-start gap-3 text-slate-700 text-xs font-semibold mb-6">
                                    <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-lg shrink-0 animate-pulse">🔧</div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">Under Maintenance</p>
                                        <p className="mt-1 text-slate-500 font-medium leading-relaxed">Fasilitas ini sedang dalam perawatan berkala dan tidak dapat menerima peminjaman untuk saat ini.</p>
                                        <p className="mt-2 text-indigo-600 font-semibold text-[10px] uppercase tracking-wide">📞 Hubungi Staff Ruangan untuk info jadwal buka kembali</p>
                                    </div>
                                </div>
                            ) : (
                                /* FITUR 1 & 2: INTERACTIVE WEEKLY CALENDAR SCHEDULE TIMETABLE */
                                <div className="border-t border-slate-100 pt-4 mb-6">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">📅 Kalender Jadwal Mingguan</p>
                                    
                                    {/* HORIZONTAL DATE SLIDER */}
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 mb-4">
                                        {(() => {
                                            const days = [];
                                            for (let i = 0; i < 7; i++) {
                                                const tempDate = new Date();
                                                tempDate.setDate(tempDate.getDate() + i);
                                                
                                                const year = tempDate.getFullYear();
                                                const month = String(tempDate.getMonth() + 1).padStart(2, '0');
                                                const dateVal = String(tempDate.getDate()).padStart(2, '0');
                                                const dateStr = `${year}-${month}-${dateVal}`;
                                                
                                                const dayName = tempDate.toLocaleDateString('id-ID', { weekday: 'short' });
                                                const dayNum = tempDate.getDate();
                                                const monthName = tempDate.toLocaleDateString('id-ID', { month: 'short' });
                                                days.push({ dateStr, dayName, dayNum, monthName });
                                            }
                                            return days.map((d) => (
                                                <button
                                                    key={d.dateStr}
                                                    type="button"
                                                    onClick={() => setSelectedCalendarDate(d.dateStr)}
                                                    className={`flex flex-col items-center p-2 rounded-xl border shrink-0 min-w-[56px] transition cursor-pointer ${
                                                        selectedCalendarDate === d.dateStr 
                                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/10' 
                                                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    <span className="text-[9px] font-bold uppercase tracking-wider">{d.dayName}</span>
                                                    <span className="text-base font-black mt-0.5">{d.dayNum}</span>
                                                    <span className="text-[8px] font-bold uppercase text-slate-400 mt-0.5">{d.monthName}</span>
                                                </button>
                                            ));
                                        })()}
                                    </div>

                                    {/* TIME SLOTS CHECKLIST */}
                                    <div className="space-y-2">
                                        {[
                                            { time: '07:00:00', label: '07:00 WIB' },
                                            { time: '09:00:00', label: '09:00 WIB' },
                                            { time: '11:00:00', label: '11:00 WIB' },
                                            { time: '13:00:00', label: '13:00 WIB' },
                                            { time: '15:00:00', label: '15:00 WIB' },
                                            { time: '17:00:00', label: '17:00 WIB' }
                                        ].map((slot) => {
                                            const bookingInSlot = bookings.find(b => 
                                                b.fasilitas_id === selectedFas.id_fasilitas && 
                                                b.tanggal === selectedCalendarDate && 
                                                b.jam?.substring(0, 5) === slot.time.substring(0, 5)
                                            );

                                            if (bookingInSlot && bookingInSlot.status === 'Approved') {
                                                return (
                                                    <div key={slot.time} className="flex justify-between items-center p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs">
                                                        <div>
                                                            <p className="font-bold text-rose-800">{slot.label}</p>
                                                            <p className="text-[10px] text-rose-500 mt-0.5 font-medium">🔴 Terisi (Peminjaman Disetujui)</p>
                                                        </div>
                                                        <span className="px-2.5 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] uppercase border border-rose-200/50">Full 🔒</span>
                                                    </div>
                                                );
                                            } else if (bookingInSlot && bookingInSlot.status === 'Pending') {
                                                return (
                                                    <div key={slot.time} className="flex justify-between items-center p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs">
                                                        <div>
                                                            <p className="font-bold text-amber-800">{slot.label}</p>
                                                            <p className="text-[10px] text-amber-500 mt-0.5 font-medium">🟡 Antrian Aktif (Belum Disetujui)</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => navigate('/booking-form', { state: { fasilitas: selectedFas, prefilledDate: selectedCalendarDate, prefilledTime: slot.time } })}
                                                            className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-3 py-1.5 rounded-lg shadow-xs transition text-[10px] uppercase cursor-pointer"
                                                        >
                                                            Antri 👥
                                                        </button>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div key={slot.time} className="flex justify-between items-center p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs">
                                                        <div>
                                                            <p className="font-bold text-emerald-800">{slot.label}</p>
                                                            <p className="text-[10px] text-emerald-500 mt-0.5 font-medium">🟢 Kosong (Siap Dipesan)</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => navigate('/booking-form', { state: { fasilitas: selectedFas, prefilledDate: selectedCalendarDate, prefilledTime: slot.time } })}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-lg shadow-xs transition text-[10px] uppercase cursor-pointer"
                                                        >
                                                            Pesan
                                                        </button>
                                                    </div>
                                                );
                                            }
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* DAFTAR ALAT YANG BISA DIPINJAM DALAM PANEL */}
                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">🛠️ Inventaris Alat Dapat Dipinjam:</h4>
                                {alatDiRuangan.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed text-center">
                                        Tidak ada inventaris alat eksternal terdaftar di ruangan ini.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {alatDiRuangan.map(alat => (
                                            <div key={alat.id_alat} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs hover:border-indigo-200 transition">
                                                <div>
                                                    <p className="font-bold text-slate-800">{alat.nama_alat}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Kondisi: <span className="text-emerald-600 font-semibold">{alat.kondisi}</span></p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-indigo-50 text-indigo-700 font-extrabold px-2 py-1 rounded-md">
                                                        {alat.jumlah} Unit
                                                    </span>
                                                    <button 
                                                        onClick={() => navigate('/booking-alat', { state: { targetAlat: alat, indukFasilitas: selectedFas } })}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-md shadow-xs transition cursor-pointer"
                                                    >
                                                        Pinjam
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* TOMBOL BOOKING UMUM (HANYA AKTIF JIKA TIDAK MAINTENANCE) */}
                            {selectedFas.status === 'Maintenance' ? (
                                <button
                                    disabled
                                    className="w-full mt-6 py-3 bg-slate-100 text-slate-400 font-bold rounded-xl text-center cursor-not-allowed text-sm block border border-slate-200 border-dashed"
                                >
                                    🔧 Under Maintenance — Booking Disabled
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/booking-form', { state: { fasilitas: selectedFas, prefilledDate: selectedCalendarDate } })}
                                    className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 text-center transition duration-200 cursor-pointer text-sm block"
                                >
                                    Ajukan Peminjaman Ruangan 🚀
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}