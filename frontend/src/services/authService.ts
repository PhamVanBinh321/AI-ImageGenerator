import apiClient from './apiClient';
import type { CurrentUser } from '../types';

type AuthResponse = {
    token: string;
    user: CurrentUser;
}

export const login = (email: string, password: string): Promise<AuthResponse> => {
    return apiClient.post('/auth/login', { email, password });
};

export const signup = (email: string, password: string): Promise<AuthResponse> => {
    return apiClient.post('/auth/register', { email, password });
};

export const getMe = (): Promise<CurrentUser> => {
    return apiClient.get('/auth/user');
};
