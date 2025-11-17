import type { ImageGenerationConfig, Message } from '../types';

// Server backend sẽ chạy ở localhost:3001 theo mặc định.
// Trong một ứng dụng production, URL này sẽ đến từ một biến môi trường.
const API_BASE_URL = 'http://localhost:3001/api';

type OptimizedPromptResponse = {
    optimized: string;
    explanation: string;
    config: ImageGenerationConfig;
};

/**
 * Hàm hỗ trợ để xử lý các request POST đến backend API.
 * Giúp đơn giản hóa việc xử lý lỗi và parsing JSON.
 * @param endpoint The API endpoint to call (e.g., 'generate-title').
 * @param body The request body to send.
 * @returns The JSON response from the server.
 */
async function postApi<T>(endpoint: string, body: object): Promise<T> {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            // Cố gắng parse lỗi từ backend, nếu không được thì dùng lỗi chung.
            const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred' }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        return response.json();
    } catch (error) {
        // Xử lý lỗi mạng hoặc khi server chưa được chạy.
        console.error(`API call to ${endpoint} failed:`, error);
        if (error instanceof TypeError) { // Thường là lỗi mạng
            throw new Error('Không thể kết nối đến máy chủ. Bạn đã khởi chạy server backend chưa? (chạy "npm start")');
        }
        throw error; // Ném lại các lỗi khác
    }
}


export const generateTitle = async (prompt: string): Promise<string> => {
    try {
        const data = await postApi<{ title: string }>('generate-title', { prompt });
        return data.title;
    } catch (error) {
        console.error("Error generating title:", error);
        return "Untitled Chat"; // Tiêu đề dự phòng
    }
}

export const optimizePrompt = async (messages: Message[]): Promise<OptimizedPromptResponse> => {
  return postApi<OptimizedPromptResponse>('optimize-prompt', { messages });
};

export const generateImage = async (prompt: string, config?: ImageGenerationConfig): Promise<string[]> => {
  const data = await postApi<{ imageUrls: string[] }>('generate-image', { prompt, config });
  if (!data.imageUrls || data.imageUrls.length === 0) {
      throw new Error("No image was generated.");
  }
  return data.imageUrls;
};
