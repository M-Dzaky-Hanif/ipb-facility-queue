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

        const result = await loginAction(email, password);
        setLoading(false);

        if (result.success) {
            // Arahkan ke dashboard spesifik sesuai peran
            if (result.user.role.toLowerCase() === 'mahasiswa') {
                navigate('/gallery');
            } else {
                navigate('/dashboard-tendik');
            }
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Selamat Datang</h2>
                    <p className="mt-2 text-center text-sm text-slate-600">Masuk ke Sistem Fasilitas & Antrian IPB</p>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                <form className="mt-8 space-y-4" onSubmit={handleLogin}>
                    <input type="email" required placeholder="Email Apps IPB" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />

                    <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition duration-200 shadow-sm disabled:bg-indigo-400">
                        {loading ? 'Memvalidasi...' : 'Masuk Sistem'}
                    </button>
                </form>
                <p className="text-center text-sm text-slate-600 mt-4">
                    Belum terdaftar? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Buat akun baru</Link>
                </p>
            </div>
        </div>
    );
}