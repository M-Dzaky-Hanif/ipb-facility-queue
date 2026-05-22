import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/axiosInstance';

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '' });
    const [pwdSuccess, setPwdSuccess] = useState('');
    const [pwdError, setPwdError] = useState('');

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwdSuccess('');
        setPwdError('');
        try {
            await API.put(`/auth/users/${user.id}/change-password`, pwdForm);
            setPwdSuccess("Password berhasil diperbarui! ✅");
            setPwdForm({ old_password: '', new_password: '' });
        } catch (err) {
            setPwdError(err.response?.data?.detail || "Gagal memperbarui password.");
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                    
                    {/* Visual Banner Header */}
                    <div className="h-32 bg-gradient-to-r from-indigo-600 to-indigo-800 flex items-end p-6 relative">
                        {/* Avatar Badge Profile Lingkaran */}
                        <div className="w-24 h-24 bg-white border-4 border-white rounded-2xl shadow-sm flex items-center justify-center text-3xl font-bold text-indigo-600 absolute -bottom-10 left-6 uppercase">
                            {user.nama?.substring(0, 2)}
                        </div>
                    </div>

                    {/* Metadata Content Form */}
                    <div className="pt-14 p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">{user.nama}</h2>
                            <p className="text-sm text-indigo-600 font-semibold capitalize tracking-wide mt-0.5">{user.role}</p>
                        </div>

                        <div className="border-t border-slate-100 pt-6 space-y-4">
                            <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Email Akun</span>
                                <span className="text-sm font-medium text-slate-800 col-span-2">{user.email}</span>
                            </div>

                            {user.nim && (
                                <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">NIM Mahasiswa</span>
                                    <span className="text-sm font-medium text-slate-800 col-span-2 font-mono">{user.nim}</span>
                                </div>
                            )}

                            {user.nip && (
                                <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">NIP Pegawai</span>
                                    <span className="text-sm font-medium text-slate-800 col-span-2 font-mono">{user.nip}</span>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-3 py-2">
                                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Status Sesi</span>
                                <span className="text-xs bg-green-50 text-green-700 font-bold px-2.5 py-1 rounded-md w-fit border border-green-200">
                                    Aktif Terautentikasi
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 🔥 SECTION UBAH PASSWORD */}
                    <div className="border-t border-slate-100 p-6 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            🔑 Ubah Password Akun
                        </h3>
                        {pwdSuccess && <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-100">{pwdSuccess}</div>}
                        {pwdError && <div className="p-3 mb-4 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl border border-rose-100">{pwdError}</div>}
                        
                        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Password Lama</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={pwdForm.old_password}
                                    onChange={e => setPwdForm(prev => ({...prev, old_password: e.target.value}))}
                                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-500 uppercase mb-1">Password Baru</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={pwdForm.new_password}
                                    onChange={e => setPwdForm(prev => ({...prev, new_password: e.target.value}))}
                                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition duration-150 cursor-pointer shadow-xs shadow-indigo-100"
                            >
                                Perbarui Password
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}