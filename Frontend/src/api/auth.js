import api from './client';

export const loginUser = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const registerUser = async (userData) => {
    // If userData is FormData, axios automatically sets Content-Type: multipart/form-data
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const logoutUser = async () => {
    await api.post('/auth/logout');
};

export const getCurrentUser = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        return null; // Return null if not authenticated
    }
};
