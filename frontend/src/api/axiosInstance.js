import axios from 'axios';

const API = axios.create({
    // Gunakan URL dari variabel Railway, tapi kalau tidak ada, pakai localhost (untuk dev)
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default API;