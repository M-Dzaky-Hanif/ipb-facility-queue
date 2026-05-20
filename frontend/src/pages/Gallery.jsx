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

    useEffect(() => {
        if (!user) navigate('/login', { replace: true });
    }, [user, navigate]);

    const fetchData = useCallback(async () => {
        try {
            const [resFas, resAlat] = await Promise.all([
                API.get('/fasilitas/'),
                API.get('/alat/')
            ]);
            
            const mappedFas = resFas.data.map((item, idx) => ({
                ...item,
                kategori: item.id_fasilitas?.toLowerCase().includes('lab') ? 'lab' : 
                          item.id_fasilitas?.toLowerCase().includes('lap') ? 'lapangan' : 'ruang',
                fakultas: idx % 2 === 0 ? 'FMIPA' : idx % 3 === 0 ? 'SV' : 'FAPERTA',
                status_pinjam: idx % 4 === 0 ? 'Dipesan' : 'Tersedia',
                isPopuler: idx % 2 === 0
            }));

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
                                        <option value="Dipesan">🔴 Sedang Dipesan / Penuh</option>
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
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${fas.status_pinjam === 'Tersedia' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{fas.status_pinjam}</span>
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
                        <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-6 h-fit max-h-[calc(100vh-50px)] overflow-y-auto">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Informasi Detail</h3>
                                <button onClick={() => setSelectedFas(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕ Close</button>
                            </div>
                            
                            <div className="space-y-3 mb-6">
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

                            <button
                                onClick={() => navigate('/booking-form', { state: { fasilitas: selectedFas } })}
                                className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 text-center transition duration-200 cursor-pointer text-sm block"
                            >
                                Ajukan Peminjaman Ruangan 🚀
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}