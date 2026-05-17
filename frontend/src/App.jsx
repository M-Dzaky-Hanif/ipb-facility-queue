import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

// IMPORT HALAMAN DASHBOARD ASLI YANG SUDAH KITA BUAT
import DashboardMhs from './pages/DashboardMhs';
import DashboardTendik from './pages/DashboardTendik';

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* SEKARANG MENGARAH KE KOMPONEN DASHBOARD ASLI */}
                    <Route path="/dashboard-mahasiswa" element={<DashboardMhs />} />
                    <Route path="/dashboard-tendik" element={<DashboardTendik />} />
                    
                    {/* Rute otomatis jika mengetik sembarang alamat */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}