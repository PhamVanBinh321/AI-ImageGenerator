import client from './client';

// Helper to cast response since interceptor returns data directly
const get = async (url: string, config?: any) => client.get(url, config) as Promise<any>;
const post = async (url: string, data?: any) => client.post(url, data) as Promise<any>;
const patch = async (url: string, data?: any) => client.patch(url, data) as Promise<any>;
const del = async (url: string, config?: any) => client.delete(url, config) as Promise<any>;

// Dashboard
export const getDashboardStats = async () => {
    return await get('/admin/dashboard/stats');
};

export const getDashboardCharts = async (period: number = 30) => {
    return await get(`/admin/dashboard/charts?period=${period}`);
};

// Users
export const getUsers = async (params: any) => {
    return await get('/admin/users', { params });
};

export const getUserDetails = async (id: string) => {
    return await get(`/admin/users/${id}`);
};

export const updateUser = async (id: string, data: { credits?: number }) => {
    return await patch(`/admin/users/${id}`, data);
};

export const deleteUser = async (id: string) => {
    return await del(`/admin/users/${id}`);
};

export const bulkUserOperation = async (data: any) => {
    return await post('/admin/users/bulk', data);
};

// Sessions
export const getSessions = async (params: any) => {
    return await get('/admin/sessions', { params });
};

export const getSessionDetails = async (id: string) => {
    return await get(`/admin/sessions/${id}`);
};

export const deleteSession = async (id: string) => {
    return await del(`/admin/sessions/${id}`);
};

// Transactions
export const getTransactions = async (params: any) => {
    return await get('/admin/transactions', { params });
};

export const getTransactionDetails = async (id: string) => {
    return await get(`/admin/transactions/${id}`);
};

export const updateTransaction = async (id: string, data: { status: string }) => {
    return await patch(`/admin/transactions/${id}`, data);
};

// Feedback
export const getReports = async (params: any) => {
    return await get('/admin/feedback/reports', { params });
};

export const dismissReport = async (messageId: string) => {
    return await patch(`/admin/feedback/reports/${messageId}`);
};

export const getFeedbackStats = async () => {
    return await get('/admin/feedback/stats');
};

// Credits
export const getCreditStats = async () => {
    return await get('/admin/credits/stats');
};

export const addCredits = async (userId: string, credits: number) => {
    return await post('/admin/credits/add', { userId, credits });
};

export const subtractCredits = async (userId: string, credits: number) => {
    return await post('/admin/credits/subtract', { userId, credits });
};

export const bulkCreditOperation = async (data: { userIds: string[], operation: 'add' | 'subtract', credits: number }) => {
    return await post('/admin/credits/bulk', data);
};

// Settings
export const getSettings = async () => {
    return await get('/admin/settings');
};

export const updateSettings = async (data: any) => {
    return await patch('/admin/settings', data);
};
