import apiClient from './apiClient';
import type { ChatSession } from '../types';

export const getSessions = (): Promise<ChatSession[]> => {
    return apiClient.get('/sessions');
};

export const createNewSession = (): Promise<ChatSession> => {
    return apiClient.post('/sessions/new', {});
};

export const deleteSession = (sessionId: string): Promise<{ msg: string }> => {
    return apiClient.delete(`/sessions/${sessionId}`);
};
