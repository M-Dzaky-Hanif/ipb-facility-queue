import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar() {
    const { user, logoutAction } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutAction();
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-xs">
            {/* Sisi Kiri: Logo Branding & Link Dinamis sesuai Peran Akun */}
            <div className="flex items-center space-x-8">
                <Link 
                    to={user?.role === 'mahasiswa' ? '/gallery' : '/dashboard-tendik'} 
                    className="flex items-center space-x-3 group"
                >
                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:bg-indigo-700 transition">
                        IPB
                    </div>
                    <div>
                        <span className="font-bold text-slate-800 text-base block leading-none mb-1">Campus Facility</span>
                        <span className="text-xs text-indigo-600 font-medium tracking-wider uppercase">Queue System</span>
                    </div>
                </Link>

                {/* MENU NAVIGASI UTAMA (Tanpa Tombol Profil di Header sesuai Request) */}
                {/* MENU NAVIGASI UTAMA */}
                {user && (
                    <div className="hidden md:flex items-center space-x-6 text-sm font-semibold">
                        {user.role === 'mahasiswa' && (
                            <>
                                <Link to="/gallery" className="text-slate-600 hover:text-indigo-600 transition">Katalog Gallery</Link>
                                <Link to="/dashboard-mahasiswa" className="text-slate-600 hover:text-indigo-600 transition">Profil & Histori Antrian</Link>
                            </>
                        )}
                        {user.role === 'tendik' && (
                            <Link to="/dashboard-tendik" className="text-indigo-600 transition">Konsol Evaluasi Tendik</Link>
                        )}
                        {user.role === 'admin' && (
                            <Link to="/dashboard-admin" className="text-indigo-600 transition">Admin Command Center</Link>
                        )}
                        {user.role === 'staff_ruang' && (
                            <Link to="/dashboard-staff" className="text-indigo-600 transition">Jadwal Operasional Staff</Link>
                        )}
                    </div>
                )}
            </div>
            
            {/* Sisi Kanan: Metadata Identitas (Teks Statis, Bukan Tombol Klik) & Tombol Keluar */}
            <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block select-none">
                    <p className="text-sm font-bold text-slate-900">{user?.nama}</p>
                    <p className="text-xs text-slate-400 font-semibold capitalize mt-0.5">{user?.role}</p>
                </div>
                <button 
                    onClick={handleLogout} 
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition duration-200 cursor-pointer border border-red-100"
                >
                    Keluar
                </button>
            </div>
        </nav>
    );
}