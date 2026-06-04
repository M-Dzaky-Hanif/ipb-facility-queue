import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axiosInstance';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nama: '', email: '', password: '', role: 'mahasiswa',
        nim: '', nip: '', id_admin: '', id_staff: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Bersihkan field yang tidak sesuai dengan role sebelum dikirim
        const payload = { ...formData };
        if (payload.role !== 'mahasiswa') payload.nim = null;
        if (payload.role !== 'tendik') payload.nip = null;
        if (payload.role !== 'admin') payload.id_admin = null;
        if (payload.role !== 'staff_ruang') payload.id_staff = null;

        try {
            await API.post('/auth/register', payload);
            setSuccess('Registrasi berhasil! Mengalihkan ke halaman login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Gagal melakukan registrasi.');
        }
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8 relative overflow-hidden"
            style={{ backgroundImage: "url('/Gedung-kampus-IPB1-scaled.jpeg')" }}
        >
            {/* Overlay Transparansi 55% tanpa blur agar gambar latar belakang tetap tajam */}
            <div className="absolute inset-0 bg-[#eff6ff]/55 z-0"></div>

            {/* Container Utama (Card Register) */}
            <div className="w-full max-w-4xl bg-[#eff6ff] rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px] transition-all duration-300 relative z-10">

                {/* Left Side: IPB Image (Fully visible with Contain) */}
                <div className="hidden md:flex md:w-1/2 relative bg-[#1c2c54] items-center justify-center select-none overflow-hidden p-8">
                    <img
                        src="/logo-ipb.png"
                        alt="IPB University"
                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                    />

                    {/* Bottom branding on image */}
                    <div className="absolute bottom-6 left-6 right-6 z-10 text-white bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                        <h3 className="text-xs sm:text-sm font-bold tracking-wide">IPB Campus Facility</h3>
                        <p className="text-[10px] text-blue-200 mt-0.5">Sistem Peminjaman & Antrian Pintar Fasilitas Kampus IPB</p>
                    </div>
                </div>

                {/* Right Side: Form (Light Blue Background) */}
                <div className="w-full md:w-1/2 flex flex-col justify-center px-8 py-10 sm:px-12 md:px-10 lg:px-12 bg-[#eff6ff]">

                    {/* Header */}
                    <div className="text-center md:text-left mb-8">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e3465] tracking-tight">
                            Mulai Akun Baru
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                            IPB Campus Facility & Queue System
                        </p>
                    </div>

                    {/* Error and Success Messages */}
                    {error && (
                        <div className="mb-5 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-xs font-semibold animate-pulse">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-5 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg text-xs font-semibold animate-pulse">
                            {success}
                        </div>
                    )}

                    {/* Registration Form */}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="nama"
                            required
                            placeholder="Nama Lengkap"
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3465]/20 focus:border-[#1e3465] text-sm text-slate-800 placeholder-slate-400 transition-all duration-200"
                        />
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="Email Apps IPB"
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3465]/20 focus:border-[#1e3465] text-sm text-slate-800 placeholder-slate-400 transition-all duration-200"
                        />
                        <input
                            type="password"
                            name="password"
                            required
                            placeholder="Password"
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3465]/20 focus:border-[#1e3465] text-sm text-slate-800 placeholder-slate-400 transition-all duration-200"
                        />

                        <div className="flex flex-col space-y-1">
                            <label className="text-xs text-slate-600 font-semibold">Pilih Peran (Role)</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3465]/20 focus:border-[#1e3465] text-sm text-slate-800 transition-all duration-200"
                            >
                                <option value="mahasiswa">Mahasiswa</option>
                                <option value="tendik">Tendik (Persetujuan)</option>
                                <option value="admin">Admin Sistem</option>
                                <option value="staff_ruang">Staff Ruangan</option>
                            </select>
                        </div>

                        {/* Dynamic Inputs based on selected role */}
                        {formData.role === 'mahasiswa' && (
                            <input
                                type="text"
                                name="nim"
                                required
                                placeholder="Nomor Induk Mahasiswa (NIM)"
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3465]/20 focus:border-[#1e3465] text-sm text-slate-800 placeholder-slate-400 transition-all duration-200"
                            />
                        )}
                        {formData.role === 'tendik' && (
                            <input
                                type="text"
                                name="nip"
                                required
                                placeholder="Nomor Induk Pegawai (NIP)"
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3465]/20 focus:border-[#1e3465] text-sm text-slate-800 placeholder-slate-400 transition-all duration-200"
                            />
                        )}

                        <button
                            type="submit"
                            className="w-full py-4 px-4 bg-[#1e3465] hover:bg-[#152549] active:scale-[0.98] text-white font-bold rounded-xl transition duration-200 shadow-md shadow-[#1e3465]/10 disabled:bg-[#1e3465]/60 text-sm mt-4"
                        >
                            Daftar Akun
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-xs text-slate-500 mt-8">
                        Sudah punya akun? <Link to="/login" className="text-[#1e3465] font-extrabold hover:underline ml-1">Login disini</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
