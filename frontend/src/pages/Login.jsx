import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { loginAction } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await loginAction(email, password);
            setLoading(false);

            if (result.success) {
                // Pengaman: Ambil role dengan opsional chaining (?.) dan konversi ke huruf kecil
                const userRole = result.user?.role?.toLowerCase();

                console.log("Berhasil login, role terdeteksi:", userRole);

                if (userRole === 'mahasiswa') {
                    navigate('/gallery');
                } else if (userRole === 'tendik') {
                    navigate('/dashboard-tendik');
                } else if (userRole === 'admin') {
                    navigate('/dashboard-admin');
                } else if (userRole === 'staff_ruang') {
                    navigate('/dashboard-staff');
                } else {
                    console.warn("Role tidak dikenali oleh sistem frontend:", userRole);
                    setError("Akun Anda tidak memiliki hak akses dashboard yang valid.");
                }
            } else {
                setError(result.message || "Email atau password salah.");
            }
        } catch (err) {
            setLoading(false);
            setError("Terjadi kesalahan jaringan saat mencoba login.");
            console.error("Login error:", err);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8 relative overflow-hidden"
            style={{ backgroundImage: "url('/Gedung-kampus-IPB1-scaled.jpeg')" }}
        >
            {/* Overlay Transparansi 55% tanpa blur agar gambar latar belakang tetap tajam */}
            <div className="absolute inset-0 bg-[#eff6ff]/55 z-0"></div>

            {/* Container Utama (Card Login) */}
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
                            Selamat Datang
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
                            Masuk ke Sistem Fasilitas & Antrian IPB
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-5 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-xs font-semibold animate-pulse">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form className="space-y-5" onSubmit={handleLogin}>
                        {/* Email Input */}
                        <div className="relative w-full">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </span>
                            <input
                                type="email"
                                required
                                placeholder="Email Apps IPB"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3465]/20 border border-slate-200 focus:border-[#1e3465] text-sm transition-all duration-200"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative w-full">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </span>
                            <input
                                type="password"
                                required
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3465]/20 border border-slate-200 focus:border-[#1e3465] text-sm transition-all duration-200"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-4 bg-[#1e3465] hover:bg-[#152549] active:scale-[0.98] text-white font-bold rounded-xl transition duration-200 shadow-md shadow-[#1e3465]/10 disabled:bg-[#1e3465]/60 text-sm mt-4"
                        >
                            {loading ? 'Memvalidasi...' : 'Masuk Sistem'}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <p className="text-center text-xs text-slate-500 mt-8">
                        Belum terdaftar? <Link to="/register" className="text-[#1e3465] font-extrabold hover:underline ml-1">Buat akun baru</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
