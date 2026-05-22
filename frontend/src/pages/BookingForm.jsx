import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axiosInstance';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';

const TIME_SLOTS = ["07:00:00", "09:00:00", "11:00:00", "13:00:00", "15:00:00", "17:00:00"];

const SLOT_DETAILS = {
    "07:00:00": { label: "Sesi 1", start: "07:00", end: "08:40" },
    "09:00:00": { label: "Sesi 2", start: "09:00", end: "10:40" },
    "11:00:00": { label: "Sesi 3", start: "11:00", end: "12:40" },
    "13:00:00": { label: "Sesi 4", start: "13:00", end: "14:40" },
    "15:00:00": { label: "Sesi 5", start: "15:00", end: "16:40" },
    "17:00:00": { label: "Sesi 6", start: "17:00", end: "18:40" }
};

export default function BookingForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Ambil data fasilitas yang dikirim dari halaman Gallery
    const targetFasilitas = location.state?.fasilitas;

    const [tanggal, setTanggal] = useState(location.state?.prefilledDate || '');
    const [jam, setJam] = useState(location.state?.prefilledTime || '09:00:00');
    const [durasiSesi, setDurasiSesi] = useState('1'); // Default: 1 Sesi (2 Jam)
    const [keperluan, setKeperluan] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [submitting, setSubmitting] = useState(false);
    
    const [showBackConfirm, setShowBackConfirm] = useState(false);

    useEffect(() => {
        if (!user) navigate('/login', { replace: true });
        if (!targetFasilitas) navigate('/gallery');
    }, [user, targetFasilitas, navigate]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setSubmitting(true);

        try {
            // Hitung slot-slot berturut-turut berdasarkan durasi sesi yang dipilih
            const startIndex = TIME_SLOTS.indexOf(jam);
            const sessionsCount = parseInt(durasiSesi);
            const slotsToBook = [];

            for (let i = 0; i < sessionsCount; i++) {
                if (startIndex + i < TIME_SLOTS.length) {
                    slotsToBook.push(TIME_SLOTS[startIndex + i]);
                }
            }

            if (slotsToBook.length === 0) {
                throw new Error("Pilihan jam mulai tidak valid!");
            }

            // Kirim permohonan booking ke backend untuk masing-masing slot secara paralel
            const promises = slotsToBook.map((slotTime, idx) => {
                const labelSesi = sessionsCount > 1 ? ` [Sesi ${idx + 1}/${sessionsCount}]` : '';
                return API.post('/bookings/', {
                    mahasiswa_id: user.id,
                    fasilitas_id: targetFasilitas.id_fasilitas,
                    tanggal,
                    jam: slotTime,
                    keperluan: `${keperluan}${labelSesi}\nDetail Kegiatan: ${deskripsi}`
                });
            });

            await Promise.all(promises);

            setMessage({ 
                type: 'success', 
                text: `Pengajuan ${sessionsCount} sesi berurutan sukses dikirim! Jika terdapat jadwal bentrok pada sesi tertentu, sistem otomatis memasukkan Anda ke antrian.` 
            });
            setTimeout(() => navigate('/dashboard-mahasiswa'), 2500);
        } catch (err) {
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.detail || err.message || 'Gagal mengirim berkas permohonan peminjaman.' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getOptionLabel = (slotTime) => {
        const details = SLOT_DETAILS[slotTime];
        const startIndex = TIME_SLOTS.indexOf(slotTime);
        const count = parseInt(durasiSesi);
        const actualSlots = Math.min(count, TIME_SLOTS.length - startIndex);
        const lastSlotTime = TIME_SLOTS[startIndex + actualSlots - 1];
        const end = SLOT_DETAILS[lastSlotTime].end;
        
        if (actualSlots === 1) {
            if (count > 1) {
                return `${details.label} — ${details.start} WIB (Selesai ${end} — Maks. 1 Sesi)`;
            }
            return `${details.label} — ${details.start} WIB (Selesai ${end})`;
        }
        return `${details.label} — ${details.start} WIB (Selesai ${end} — ${actualSlots} Sesi)`;
    };

    if (!user || !targetFasilitas) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Formulir Pengajuan Peminjaman</h2>
                        <p className="text-sm text-slate-500">Mengajukan izin penggunaan sarana: <span className="font-bold text-indigo-600">{targetFasilitas.nama_fasilitas}</span></p>
                    </div>

                    {/* 💡 BANNER INFORMASI BUFFER 20 MENIT */}
                    <div className="bg-indigo-50/50 border border-indigo-100/60 p-4 rounded-xl flex gap-3 items-start">
                        <span className="text-lg">📢</span>
                        <div className="text-xs text-indigo-800 leading-relaxed font-semibold">
                            <span className="font-extrabold uppercase text-indigo-900 block mb-1">Kebijakan Durasi & Buffer Waktu IPB:</span>
                            Masing-masing slot sesi berdurasi aktif <span className="text-indigo-600 font-extrabold">1 jam 40 menit</span>. 
                            Ruangan wajib dikosongkan <span className="text-indigo-600 font-extrabold">20 menit sebelum sesi berikutnya dimulai</span> untuk proses pembersihan, sterilisasi, dan penataan ulang oleh staf operasional ruangan.
                        </div>
                    </div>

                    {message.text && (
                        <div className={`p-4 rounded-xl text-sm font-medium border ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                        }`}>{message.text}</div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Tanggal Kegiatan</label>
                            <input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Jam Mulai</label>
                                <select value={jam} onChange={(e) => setJam(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500/20 text-sm">
                                    {TIME_SLOTS.map(slotTime => (
                                        <option key={slotTime} value={slotTime}>
                                            {getOptionLabel(slotTime)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Durasi Peminjaman</label>
                                <select value={durasiSesi} onChange={(e) => setDurasiSesi(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500/20 text-sm">
                                    <option value="1">1 Sesi (1 Jam 40 Menit)</option>
                                    <option value="2">2 Sesi Berurutan (3 Jam 40 Menit)</option>
                                    <option value="3">3 Sesi Berurutan (5 Jam 40 Menit)</option>
                                </select>
                            </div>
                        </div>

                        {/* 🎫 CARD SUMMARY BOOKING DINAMIS */}
                        {(() => {
                            const startIndex = TIME_SLOTS.indexOf(jam);
                            const count = parseInt(durasiSesi);
                            const actualSlots = Math.min(count, TIME_SLOTS.length - startIndex);
                            const lastSlotTime = TIME_SLOTS[startIndex + actualSlots - 1];
                            const startTime = SLOT_DETAILS[jam].start;
                            const endTime = SLOT_DETAILS[lastSlotTime].end;
                            
                            return (
                                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col gap-2.5">
                                    <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">Ringkasan Jadwal Peminjaman:</span>
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-slate-200 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-800">Rentang Waktu:</span>
                                            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700">
                                                ⏱️ {startTime} - {endTime} WIB
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-800">Jumlah Sesi:</span>
                                            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-700">
                                                📚 {actualSlots} Sesi Berurutan
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-slate-500 text-xs leading-relaxed">
                                        <span className="font-bold text-slate-600">Sesi yang dipesan: </span>
                                        {TIME_SLOTS.slice(startIndex, startIndex + actualSlots).map((time, idx) => {
                                            const detail = SLOT_DETAILS[time];
                                            return (
                                                <span key={time} className="inline-block bg-white border border-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600 mr-1 mt-1">
                                                    {detail.label} ({detail.start}-{detail.end})
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Keperluan / Agenda Utama</label>
                            <input type="text" required placeholder="Contoh: Praktikum Kelompok APPL" value={keperluan} onChange={(e) => setKeperluan(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Deskripsi Kegiatan (Rincian & Urgensi)</label>
                            <textarea required rows="4" placeholder="Jelaskan secara detail agenda kegiatan Anda di sini agar Tendik dapat menilai tingkat kepentingan acara jika terjadi bentrok jadwal..." value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="p-2.5 border border-slate-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowBackConfirm(true)} className="w-1/2 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-center cursor-pointer text-sm">Batal</button>
                            <button type="submit" disabled={submitting} className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-center cursor-pointer text-sm shadow-xs flex justify-center items-center">
                                {submitting ? "Mengirim..." : "Kirim Pengajuan"}
                            </button>
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