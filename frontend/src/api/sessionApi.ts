import client from './client';
// ChatSession type unused but kept for reference or future use
// import type { ChatSession } from '../types';

const get = async (url: string, config?: any) => client.get(url, config) as Promise<any>;
const post = async (url: string, data?: any) => client.post(url, data) as Promise<any>;
const del = async (url: string, config?: any) => client.delete(url, config) as Promise<any>;

export const getSessions = async () => {
    return get('/sessions');
};

export const createNewSession = async () => {
    return post('/sessions');
};

export const getSessionDetails = async (id: string) => {
    return get(`/sessions/${id}`);
};

export const updateSession = async (id: string, updates: any) => {
    return client.patch(`/sessions/${id}`, updates) as Promise<any>;
};

export const deleteSession = async (id: string) => {
    return del(`/sessions/${id}`);
};

export const updateFeedback = async (sessionId: string, messageId: string, type: 'like' | 'dislike' | null) => {
    return await post(`/sessions/${sessionId}/messages/${messageId}/feedback`, { type }); // Changed to use 'post' helper
};

export const reportMessage = async (sessionId: string, messageId: string) => {
    return await post(`/sessions/${sessionId}/messages/${messageId}/report`); // Changed to use 'post' helper
};
