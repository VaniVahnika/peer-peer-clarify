import api from './client';

export const getRoadmaps = async () => {
    const response = await api.get('/roadmaps');
    return response.data;
};

export const getRoadmapById = async (id) => {
    const response = await api.get(`/roadmaps/${id}`);
    return response.data;
};

export const getUserProgress = async () => {
    const response = await api.get('/roadmaps/my-progress');
    return response.data;
};
