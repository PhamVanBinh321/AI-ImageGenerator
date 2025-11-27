import apiClient from './apiClient';

// Dashboard
export const getDashboardStats = async () => {
  return await apiClient.get('/admin/dashboard/stats');
};

export const getDashboardCharts = async (period: number = 30) => {
  return await apiClient.get(`/admin/dashboard/charts?period=${period}`);
};

// Users
export const getUsers = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  minCredits?: number;
  maxCredits?: number;
  startDate?: string;
  endDate?: string;
}) => {
  return await apiClient.get('/admin/users', { params });
};

export const getUserDetails = async (id: string) => {
  return await apiClient.get(`/admin/users/${id}`);
};

export const updateUser = async (id: string, data: { credits?: number }) => {
  return await apiClient.patch(`/admin/users/${id}`, data);
};

export const deleteUser = async (id: string) => {
  return await apiClient.delete(`/admin/users/${id}`);
};

export const bulkUserOperation = async (data: {
  userIds: string[];
  operation: 'add' | 'subtract' | 'delete';
  credits?: number;
}) => {
  return await apiClient.post('/admin/users/bulk', data);
};

// Sessions
export const getSessions = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  hasImages?: boolean;
}) => {
  return await apiClient.get('/admin/sessions', { params });
};

export const getSessionDetails = async (id: string) => {
  return await apiClient.get(`/admin/sessions/${id}`);
};

export const deleteSession = async (id: string) => {
  return await apiClient.delete(`/admin/sessions/${id}`);
};

// Transactions
export const getTransactions = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  packageId?: string;
}) => {
  return await apiClient.get('/admin/transactions', { params });
};

export const getTransactionDetails = async (id: string) => {
  return await apiClient.get(`/admin/transactions/${id}`);
};

export const updateTransaction = async (id: string, data: { status: string }) => {
  return await apiClient.patch(`/admin/transactions/${id}`, data);
};

// Feedback
export const getReports = async (params: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) => {
  return await apiClient.get('/admin/feedback/reports', { params });
};

export const dismissReport = async (messageId: string) => {
  return await apiClient.patch(`/admin/feedback/reports/${messageId}`);
};

export const getFeedbackStats = async () => {
  return await apiClient.get('/admin/feedback/stats');
};

// Credits
export const addCredits = async (userId: string, credits: number) => {
  return await apiClient.post('/admin/credits/add', { userId, credits });
};

export const subtractCredits = async (userId: string, credits: number) => {
  return await apiClient.post('/admin/credits/subtract', { userId, credits });
};

export const bulkCreditOperation = async (data: {
  userIds: string[];
  operation: 'add' | 'subtract';
  credits: number;
}) => {
  return await apiClient.post('/admin/credits/bulk', data);
};

export const getCreditStats = async () => {
  return await apiClient.get('/admin/credits/stats');
};

// Settings
export const getSettings = async () => {
  return await apiClient.get('/admin/settings');
};

export const updateSettings = async (data: any) => {
  return await apiClient.patch('/admin/settings', data);
};

