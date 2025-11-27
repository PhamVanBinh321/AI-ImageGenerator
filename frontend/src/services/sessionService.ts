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

/**
 * Update feedback for a message (like/dislike)
 */
export const updateMessageFeedback = async (
    sessionId: string,
    messageId: string,
    type: 'like' | 'dislike' | null
): Promise<{ success: boolean; feedback: { type: 'like' | 'dislike' | null } }> => {
    return apiClient.post(`/sessions/${sessionId}/messages/${messageId}/feedback`, { type });
};

/**
 * Report a message
 */
export const reportMessage = async (
    sessionId: string,
    messageId: string
): Promise<{ success: boolean; message: string }> => {
    return apiClient.post(`/sessions/${sessionId}/messages/${messageId}/report`, {});
};