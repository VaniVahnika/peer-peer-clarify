import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
    withCredentials: true, // Important: Send cookies with requests
    headers: {
        // 'Content-Type': 'application/json', // Let axios set this automatically
    },
});

// Response interceptor to handle errors (e.g., token expiration)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token might be invalid or expired
            // Optionally redirect to login or clear token
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
