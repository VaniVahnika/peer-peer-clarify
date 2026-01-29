import api from './client';

export const getDoubts = async () => {
    const response = await api.get('/doubts');
    return response.data;
};

export const createDoubt = async (doubtData) => {
    const response = await api.post('/doubts', doubtData); // Supports roleAccess('user')
    return response.data;
};

// ... other endpoints if needed
