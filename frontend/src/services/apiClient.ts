// Fix: Manually define types for import.meta.env since vite/client types are not resolving.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

// Fix: Augment the global ImportMeta interface instead of redefining it in the module scope.
declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

import axios from 'axios';

const apiClient = axios.create({
    baseURL: (import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Thêm token JWT vào header của tất cả các request.
 * @param token - Token xác thực hoặc null để xóa.
 */
export const setAuthToken = (token: string | null) => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
    }
};

// Interceptor để xử lý lỗi một cách nhất quán, đảm bảo các lỗi từ API
// được trả về dưới dạng Error object để các component có thể bắt và xử lý.
apiClient.interceptors.response.use(
    response => response.data,
    error => {
        const message = error.response?.data?.error || error.message || 'Đã có lỗi không xác định xảy ra.';
        return Promise.reject(new Error(message));
    }
);

export default apiClient;