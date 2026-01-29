import api from './client';

export const getPendingInstructors = async () => {
    const response = await api.get('/admin/pending-instructors');
    return response.data;
};

export const getDashboardStats = async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
};

export const verifyInstructor = async (instructorId, action) => {
    // action: 'approve' | 'reject'
    // Backend expects { action } in body, endpoint is PUT
    const response = await api.put(`/admin/verify-instructor/${instructorId}`, { action });
    return response.data;
};

export const getAllInstructors = async () => {
    const response = await api.get('/admin/instructors');
    return response.data;
};

export const deleteInstructor = async (id) => {
    const response = await api.delete(`/admin/instructor/${id}`);
    return response.data;
};

// Moderation APIs not yet implemented in backend
export const getFlaggedContent = async () => {
    // const response = await api.get('/admin/moderation');
    // return response.data;
    return []; // Return empty mock for now
};

export const resolveFlag = async (contentId, action) => {
    // const response = await api.post(`/admin/moderation/${contentId}`, { action });
    // return response.data;
    return {};
};
