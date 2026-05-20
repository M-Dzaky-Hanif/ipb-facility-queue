import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();

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

                </div>
            </div>
        </div>
    );
}