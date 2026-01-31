import client from './client';
// import { User } from '../types';

const post = async (url: string, data?: any) => client.post(url, data) as Promise<any>;
const get = async (url: string) => client.get(url) as Promise<any>;

export const login = async (email: string, password: string) => {
    return post('/auth/login', { email, password });
};

export const signup = async (email: string, password: string) => {
    return post('/auth/signup', { email, password });
};

export const logout = async () => {
    return post('/auth/logout');
};

export const getProfile = async () => {
    return get('/auth/profile');
};

export const updateProfile = async (data: any) => {
    return client.put('/auth/profile', data) as Promise<any>;
};

export const changePassword = async (oldPass: string, newPass: string) => {
    return client.put('/auth/change-password', { oldPass, newPass });
};

export const deleteAccount = async (password: string) => {
    return client.delete('/auth/account', { data: { password } });
};
