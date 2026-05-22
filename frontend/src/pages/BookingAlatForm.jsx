import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';

export default function BookingAlatForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Tangkap data alat dan ruangan induk yang dikirim dari Gallery
    const targetAlat = location.state?.targetAlat;
    const indukFasilitas = location.state?.indukFasilitas;

    const [tanggal, setTanggal] = useState('');
    const [jam, setJam] = useState('09:00:00');
    const [keperluan, setKeperluan] = useState('');
    const [jumlahPinjam, setJumlahPinjam] = useState(1);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const [showBackConfirm, setShowBackConfirm] = useState(false);

    useEffect(() => {
        if (!user) navigate('/login', { replace: true });
        if (!targetAlat) navigate('/gallery');
    }, [user, targetAlat, navigate]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        try {
            await API.post('/bookings/', {
                mahasiswa_id: user.id,
                fasilitas_id: indukFasilitas.id_fasilitas, // Tetap dicatat alat ini milik ruangan mana
                alat_id: targetAlat.id_alat,
                jumlah_alat: jumlahPinjam,
                tanggal,
                jam,
                keperluan: `[Pinjam Alat: ${targetAlat.nama_alat} x${jumlahPinjam}] - ${keperluan}`
            });
            setMessage({ type: 'success', text: 'Pengajuan alat sukses dikirim ke antrian evaluasi Tendik!' });
            setTimeout(() => navigate('/dashboard-mahasiswa'), 2000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Gagal mengirim berkas permohonan.' });
        }
    };

    if (!user || !targetAlat) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Formulir Peminjaman Inventaris</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Mengajukan peminjaman alat <span className="font-bold text-indigo-600">{targetAlat.nama_alat}</span> dari {indukFasilitas?.nama_fasilitas}.
                    </p>

                    {message.text && (
                        <div className={`p-4 mb-6 rounded-xl text-sm font-medium border ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                        }`}>{message.text}</div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {/* INPUT KUANTITAS (Dibatasi Maksimal Stok) */}
                        <div className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Jumlah Unit Dipinjam (Maks: {targetAlat.jumlah})</label>
                            <input 
                                type="number" 
                                min="1" 
                                max={targetAlat.jumlah} 
                                required 
                                value={jumlahPinjam} 
                                onChange={(e) => setJumlahPinjam(parseInt(e.target.value))} 
                                className="p-2.5 border border-slate-300 rounded-xl outline-none w-32 font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500/20" 
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Tanggal Kegiatan</label>
                            <input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Jam Mulai</label>
                            <select value={jam} onChange={(e) => setJam(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500/20 text-sm">
                                <option value="07:00:00">07:00 WIB</option>
                                <option value="09:00:00">09:00 WIB</option>
                                <option value="11:00:00">11:00 WIB</option>
                                <option value="13:00:00">13:00 WIB</option>
                                <option value="15:00:00">15:00 WIB</option>
                                <option value="17:00:00">17:00 WIB</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Keperluan / Agenda</label>
                            <textarea required rows="3" placeholder="Contoh: Praktikum lapang, butuh proyektor..." value={keperluan} onChange={(e) => setKeperluan(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowBackConfirm(true)} className="w-1/2 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-center cursor-pointer text-sm">Batal</button>
                            <button type="submit" className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center cursor-pointer text-sm shadow-xs">Ajukan Alat 🚀</button>
                        </div>
                    </form>
                </div>
            </div>

            <ConfirmModal 
                isOpen={showBackConfirm}
                title="Batalkan Pengisian"
                message="Apakah Anda yakin ingin membatalkan pengisian formulir? Data yang belum dikirim akan hilang."
                confirmText="Ya, Batalkan"
                cancelText="Kembali"
                confirmColor="rose"
                onConfirm={() => navigate('/gallery')}
                onCancel={() => setShowBackConfirm(false)}
            />
        </div>
    );
}