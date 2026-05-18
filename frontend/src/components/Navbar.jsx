import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { user, logoutAction } = useAuth();
    const navigate = useNavigate();

    // 3. Buat fungsi handler logout
    const handleLogout = () => {
        logoutAction();
        navigate('/login'); // Redirect paksa ke halaman login
    };

    return (
        <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-xs">
            <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    IPB
                </div>
                <div>
                    <span className="font-bold text-slate-800 text-base block leading-none mb-1">Campus Facility</span>
                    <span className="text-xs text-indigo-600 font-medium tracking-wider uppercase">Queue System</span>
                </div>
            </div>
            
            <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900">{user?.nama}</p>
                    <p className="text-xs text-slate-500 font-medium capitalize">{user?.role}</p>
                </div>
                <button 
                    onClick={logoutAction} 
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition duration-200 cursor-pointer"
                >
                    Keluar
                </button>
            </div>
        </nav>
    );
}