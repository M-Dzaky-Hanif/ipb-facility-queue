import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardMhs from './pages/DashboardMhs';
import DashboardTendik from './pages/DashboardTendik';
import Gallery from './pages/Gallery';
import BookingForm from './pages/BookingForm';
import BookingAlatForm from './pages/BookingAlatForm';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardStaff from './pages/DashboardStaff';

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard-mahasiswa" element={<DashboardMhs />} />
                    <Route path="/dashboard-tendik" element={<DashboardTendik />} />
                    <Route path="/gallery" element={<Gallery />} /> 
                    <Route path="/booking-form" element={<BookingForm />} />
                    <Route path="/booking-alat" element={<BookingAlatForm />} />
                    <Route path="/dashboard-admin" element={<DashboardAdmin />} />
                    <Route path="/dashboard-staff" element={<DashboardStaff />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}