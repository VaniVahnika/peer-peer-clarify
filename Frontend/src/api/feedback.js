import client from './client';

export const submitFeedback = async (feedbackData) => {
    const res = await client.post('/sessions/feedback', feedbackData);
    return res.data;
};

export const getSessionFeedback = async (sessionId) => {
    const res = await client.get(`/sessions/${sessionId}/feedback`);
    return res.data;
};
