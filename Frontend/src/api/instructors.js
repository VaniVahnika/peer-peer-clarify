import api from './client';

export const getInstructors = async (domain) => {
    // Assuming backend filters by properties or query param
    // If backend expects /instructors?domain=..., pass it
    const params = domain ? { domain } : {};
    const response = await api.get('/instructors', { params });
    return response.data;
};

export const getInstructorStats = async () => {
    const response = await api.get('/instructors/stats');
    return response.data;
};

export const createSessionRequest = async (requestData) => {
    const response = await api.post('/session-requests', requestData);
    return response.data;
};

export const createInstructorPost = async (postData) => {
    const response = await api.post('/instructors/posts', postData);
    return response.data;
};

export const updateInstructorStatus = async (status) => {
    const response = await api.put('/instructors/status', { statusForSession: status });
    return response.data;
};
