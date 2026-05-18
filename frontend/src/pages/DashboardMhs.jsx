import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function DashboardMhs() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [fasilitas, setFasilitas] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [selectedFasilitas, setSelectedFasilitas] = useState('');
    const [tanggal, setTanggal] = useState('');
    const [jam, setJam] = useState('09:00:00');
    const [keperluan, setKeperluan] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    // Membungkus fungsi dengan useCallback agar aman dimasukkan ke dependency array useEffect
    const fetchData = useCallback(async () => {
        try {
            const resFas = await API.get('/fasilitas/');
            setFasilitas(resFas.data);

            if (user?.id) {
                const resBook = await API.get(`/bookings/mahasiswa/${user.id}`);
                setMyBookings(resBook.data);
            }
        } catch (err) {
            console.error("Gagal mengambil data:", err);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [fetchData, user]);

    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    // EARLY RETURN
    if (!user) {
        return null;
    }

    const handleAjukan = async (e) => {
        e.preventDefault();
        if (!user) {
            setMessage({ type: 'error', text: 'Sesi login habis. Silakan login kembali.' });
            return;
        }
        setMessage({ type: '', text: '' });

        const payload = {
            fasilitas_id: selectedFasilitas,
            tanggal: tanggal,
            jam: jam,
            keperluan: keperluan,
            mahasiswa_id: user.id
        };

        try {
            await API.post('/bookings/', payload);
            setMessage({ type: 'success', text: 'Selesai! Pengajuan booking berhasil dibuat (Status: Pending).' });
            setKeperluan('');
            fetchData();
        } catch (err) {
            // MENANGKAP INTEGRASI OTOMATIS ANTRIAN (HTTP 202 ACCEPTED)
            if (err.response?.status === 202) {
                const queueInfo = err.response.data.detail;
                setMessage({ 
                    type: 'queue', 
                    text: `Jadwal Penuh! Anda otomatis dialihkan ke Sistem Antrian untuk ${queueInfo.fasilitas_id}. Anda memegang Nomor Antrian: ${queueInfo.nomor_antrian}.` 
                });
                fetchData();
            } else {
                setMessage({ type: 'error', text: err.response?.data?.detail || 'Gagal mengajukan peminjaman.' });
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Bagian Kiri: Form Pengajuan */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Form Pinjam Fasilitas</h3>
                    
                    {message.text && (
                        <div className={`p-4 rounded-xl text-sm mb-4 font-medium ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                            message.type === 'queue' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                            'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleAjukan} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Pilih Ruangan</label>
                            <select required value={selectedFasilitas} onChange={(e) => setSelectedFasilitas(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">-- Pilih Fasilitas IPB --</option>
                                {fasilitas.map((f) => (
                                    <option key={f.id_fasilitas} value={f.id_fasilitas}>{f.nama_fasilitas} ({f.id_fasilitas})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tanggal</label>
                            <input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Waktu / Jam</label>
                            <select value={jam} onChange={(e) => setJam(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="09:00:00">09:00 WIB</option>
                                <option value="11:00:00">11:00 WIB</option>
                                <option value="13:00:00">13:00 WIB</option>
                                <option value="15:00:00">15:00 WIB</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Keperluan</label>
                            <textarea required rows="3" value={keperluan} onChange={(e) => setKeperluan(e.target.value)} placeholder="Contoh: Praktikum Kelompok Analisis Desain Sistem..." className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                        </div>
                        <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition duration-200 cursor-pointer">
                            Kirim Pengajuan
                        </button>
                    </form>
                </div>

                {/* Bagian Kanan: Riwayat Status & Antrian */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Status Pengajuan & Antrian Anda</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="p-3 rounded-l-lg">Fasilitas</th>
                                        <th className="p-3">Waktu</th>
                                        <th className="p-3">Keperluan</th>
                                        <th className="p-3 rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {myBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-4 text-center text-slate-400">Belum ada riwayat peminjaman.</td>
                                        </tr>
                                    ) : (
                                        myBookings.map((b) => (
                                            <tr key={b.id_booking} className="hover:bg-slate-50/50 transition">
                                                <td className="p-3 font-semibold text-slate-800">{b.fasilitas_id}</td>
                                                <td className="p-3 text-xs">{b.tanggal} <span className="text-slate-400 block">{b.jam}</span></td>
                                                <td className="p-3 text-slate-500 max-w-xs truncate">{b.keperluan}</td>
                                                <td className="p-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        b.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                                                        b.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                                                        'bg-amber-50 text-amber-700'
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
        </div>
    );
}