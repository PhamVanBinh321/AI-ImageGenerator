import type { ImageGenerationConfig, Message } from '../types';
import apiClient from './apiClient';

type OptimizedPromptResponse = {
    optimized: string;
    explanation: string;
    config: ImageGenerationConfig;
};

export const generateTitle = async (prompt: string, sessionId: string): Promise<{ title: string }> => {
    try {
        // Fix: Cast the response type because the Axios interceptor returns the data object directly.
        // Fix: Use 'as unknown' to bridge the type conversion from AxiosResponse to the data type.
        const data = await apiClient.post<{ title: string }>('/generate-title', { prompt, sessionId }) as unknown as { title: string };
        return data;
    } catch (error) {
        console.error("Error generating title:", error);
        // Trả về một object thay vì string để nhất quán
        return { title: "Untitled Chat" };
    }
}

export const optimizePrompt = async (messages: Message[], sessionId: string): Promise<OptimizedPromptResponse> => {
  // Fix: Cast the response type because the Axios interceptor returns the data object directly.
  // Fix: Use 'as unknown' to bridge the type conversion from Promise<AxiosResponse> to Promise<data type>.
  return apiClient.post<OptimizedPromptResponse>('/optimize-prompt', { messages, sessionId }) as unknown as Promise<OptimizedPromptResponse>;
};

export const generateImage = async (prompt: string, sessionId: string, messageId: string, config?: ImageGenerationConfig): Promise<{ imageUrls: string[], credits: number }> => {
  // Fix: Cast the response type because the Axios interceptor returns the data object directly.
  // Fix: Use 'as unknown' to bridge the type conversion from AxiosResponse to the data type.
  const data = await apiClient.post<{ imageUrls: string[], credits: number }>('/generate-image', { prompt, config, sessionId, messageId }) as unknown as { imageUrls: string[], credits: number };
  if (!data.imageUrls || data.imageUrls.length === 0) {
      throw new Error("No image was generated.");
  }
  return data;
};