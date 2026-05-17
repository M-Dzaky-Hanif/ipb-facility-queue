import { createContext, useState, useContext } from 'react';
import API from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Membaca data user dari localStorage saat aplikasi pertama kali dibuka
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user_session');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const loginAction = async (email, password) => {
        try {
            const response = await API.post('/auth/login', { email, password });
            if (response.data) {
                const userData = response.data.user;
                
                setUser(userData);
                // SIMPAN KE LOCALSTORAGE
                localStorage.setItem('user_session', JSON.stringify(userData)); 
                
                return { success: true, user: userData };
            }
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.detail || "Terjadi kesalahan saat login." 
            };
        }
    };

    const logoutAction = () => {
        setUser(null);
        // HAPUS DARI LOCALSTORAGE
        localStorage.removeItem('user_session'); 
    };

    return (
        <AuthContext.Provider value={{ user, loginAction, logoutAction }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);