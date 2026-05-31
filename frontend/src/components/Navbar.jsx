import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axiosInstance';
import ConfirmModal from './ConfirmModal';

export default function Navbar() {
    const { user, logoutAction } = useAuth();
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    const unreadCount = notifs.filter(n => !n.status_baca).length;

    const fetchNotifications = useCallback(async () => {
        try {
            if (user?.id) {
                const res = await API.get(`/notifikasi/user/${user.id}`);
                setNotifs(res.data);
            }
        } catch (err) {
            console.error("Gagal memuat notifikasi:", err);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
            return () => clearInterval(interval);
        } else {
            setNotifs([]);
        }
    }, [fetchNotifications, user]);

    const handleMarkRead = async (id_notifikasi) => {
        try {
            await API.put(`/notifikasi/${id_notifikasi}/read`);
            setNotifs(prev => prev.map(n => n.id_notifikasi === id_notifikasi ? { ...n, status_baca: true } : n));
        } catch (err) {
            console.error("Gagal menandai dibaca:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            if (user?.id) {
                await API.put(`/notifikasi/user/${user.id}/read-all`);
                setNotifs(prev => prev.map(n => ({ ...n, status_baca: true })));
            }
        } catch (err) {
            console.error("Gagal menandai semua dibaca:", err);
        }
    };

    const formatTime = (timeStr) => {
        try {
            const dateObj = new Date(timeStr);
            const now = new Date();
            const diffMs = now - dateObj;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return "Baru saja";
            if (diffMins < 60) return `${diffMins} menit lalu`;
            
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours} jam lalu`;
            
            return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return "";
        }
    };

    const handleLogoutConfirm = () => {
        setShowLogoutModal(false);
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
            
            {/* Sisi Kanan: Metadata Identitas, Lonceng Notifikasi, & Tombol Keluar */}
            <div className="flex items-center space-x-4">
                {user && (
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition cursor-pointer relative"
                        >
                            {/* Bell Icon SVG */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5.5 h-5.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                </span>
                            )}
                        </button>

                        {/* Dropdown Panel Notifikasi */}
                        {showNotifDropdown && (
                            <>
                                {/* Overlay transparent to close dropdown when clicking outside */}
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                                <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 py-3 overflow-hidden animate-[slideIn_0.2s_ease-out] print:hidden">
                                    <div className="px-4 pb-2 border-b border-slate-50 flex justify-between items-center">
                                        <h4 className="text-sm font-extrabold text-slate-800">Notifikasi</h4>
                                        {unreadCount > 0 && (
                                            <button 
                                                onClick={handleMarkAllRead}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                                            >
                                                Tandai semua dibaca
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                                        {notifs.length === 0 ? (
                                            <div className="p-6 text-center text-xs text-slate-400 font-medium">
                                                Tidak ada notifikasi baru.
                                            </div>
                                        ) : (
                                            notifs.map(n => (
                                                <div 
                                                    key={n.id_notifikasi} 
                                                    onClick={() => {
                                                        if (!n.status_baca) handleMarkRead(n.id_notifikasi);
                                                    }}
                                                    className={`p-3 text-left transition hover:bg-slate-50/80 cursor-pointer flex gap-3.5 items-start ${!n.status_baca ? 'bg-indigo-50/20' : ''}`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.status_baca ? 'bg-indigo-600' : 'bg-transparent'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs leading-relaxed text-slate-700 ${!n.status_baca ? 'font-bold' : 'font-medium'}`}>
                                                            {n.pesan}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 font-bold block mt-1">
                                                            {formatTime(n.waktu)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="text-right hidden sm:block select-none border-l border-slate-200 pl-4">
                    <p className="text-sm font-bold text-slate-900">{user?.nama}</p>
                    <p className="text-xs text-slate-400 font-semibold capitalize mt-0.5">{user?.role}</p>
                </div>
                <button 
                    onClick={() => setShowLogoutModal(true)} 
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition duration-200 cursor-pointer border border-red-100"
                >
                    Keluar
                </button>
            </div>

            <ConfirmModal 
                isOpen={showLogoutModal}
                title="Konfirmasi Keluar"
                message="Apakah Anda yakin ingin keluar dari sistem?"
                confirmText="Ya, Keluar"
                cancelText="Batal"
                confirmColor="rose"
                onConfirm={handleLogoutConfirm}
                onCancel={() => setShowLogoutModal(false)}
            />
        </nav>
    );
}