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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Mulai Akun Baru</h2>
                    <p className="mt-2 text-center text-sm text-slate-600">IPB Campus Facility & Queue System</p>
                </div>
                
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
                {success && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">{success}</div>}

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <input type="text" name="nama" required placeholder="Nama Lengkap" onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="email" name="email" required placeholder="Email Apps IPB" onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="password" name="password" required placeholder="Password" onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    
                    <div className="flex flex-col space-y-1">
                        <label className="text-sm text-slate-600 font-medium">Pilih Peran (Role)</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="mahasiswa">Mahasiswa</option>
                            <option value="tendik">Tendik (Persetujuan)</option>
                            <option value="admin">Admin Sistem</option>
                            <option value="staff_ruang">Staff Ruangan</option>
                        </select>
                    </div>

                    {/* Input Dinamis Berdasarkan Role */}
                    {formData.role === 'mahasiswa' && (
                        <input type="text" name="nim" required placeholder="Nomor Induk Mahasiswa (NIM)" onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    )}
                    {formData.role === 'tendik' && (
                        <input type="text" name="nip" required placeholder="Nomor Induk Pegawai (NIP)" onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    )}

                    <button type="submit" className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition duration-200 shadow-sm shadow-indigo-100">
                        Daftar Akun
                    </button>
                </form>
                <p className="text-center text-sm text-slate-600 mt-4">
                    Sudah punya akun? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Login disini</Link>
                </p>
            </div>
        </div>
    );
}