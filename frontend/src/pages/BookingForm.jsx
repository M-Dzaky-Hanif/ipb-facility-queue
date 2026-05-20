import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';

export default function BookingForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Ambil data fasilitas yang dikirim dari halaman Gallery
    const targetFasilitas = location.state?.fasilitas;

    const [tanggal, setTanggal] = useState('');
    const [jam, setJam] = useState('09:00:00');
    const [keperluan, setKeperluan] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!user) navigate('/login', { replace: true });
        if (!targetFasilitas) navigate('/gallery');
    }, [user, targetFasilitas, navigate]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        try {
            await API.post('/bookings/', {
                mahasiswa_id: user.id,
                fasilitas_id: targetFasilitas.id_fasilitas,
                tanggal,
                jam,
                keperluan
            });
            setMessage({ type: 'success', text: 'Pengajuan sukses! Jika jadwal bentrok, sistem otomatis memasukkan Anda ke antrian.' });
            setTimeout(() => navigate('/dashboard-mahasiswa'), 2000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Gagal mengirim berkas permohonan.' });
        }
    };

    if (!user || !targetFasilitas) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Formulir Pengajuan Peminjaman</h2>
                    <p className="text-sm text-slate-500 mb-6">Mengajukan izin penggunaan sarana: <span className="font-bold text-indigo-600">{targetFasilitas.nama_fasilitas}</span></p>

                    {message.text && (
                        <div className={`p-4 mb-6 rounded-xl text-sm font-medium border ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                        }`}>{message.text}</div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Tanggal Kegiatan</label>
                            <input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl outline-none" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Jam Mulai</label>
                            <select value={jam} onChange={(e) => setJam(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl outline-none bg-white">
                                <option value="09:00:00">09:00 WIB</option>
                                <option value="11:00:00">11:00 WIB</option>
                                <option value="13:00:00">13:00 WIB</option>
                                <option value="15:00:00">15:00 WIB</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Keperluan / Agenda</label>
                            <textarea required rows="3" placeholder="Contoh: Praktikum Kelompok Mata Kuliah APPL..." value={keperluan} onChange={(e) => setKeperluan(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl outline-none resize-none" />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => navigate('/gallery')} className="w-1/2 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-center cursor-pointer text-sm">Batal</button>
                            <button type="submit" className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center cursor-pointer text-sm shadow-xs">Kirim Pengajuan</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}