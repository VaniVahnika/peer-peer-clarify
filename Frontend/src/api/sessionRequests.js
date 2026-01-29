import api from './client';

export const getSessionRequests = async () => {
    const response = await api.get('/session-requests');
    return response.data;
};

export const updateSessionRequest = async (id, data) => {
    const response = await api.put(`/session-requests/${id}`, data);
    return response.data;
};

export const deleteSessionRequest = async (id) => {
    const response = await api.delete(`/session-requests/${id}`);
    return response.data;
};
