import client from './client';
import type { ImageGenerationConfig, Message } from '../types';

type OptimizedPromptResponse = {
    optimized: string;
    explanation: string;
    config: ImageGenerationConfig;
    messageId: string;
};

export const generateTitle = async (prompt: string, sessionId: string): Promise<{ title: string }> => {
    try {
        const data = await client.post<{ title: string }>('/generate-title', { prompt, sessionId }) as unknown as { title: string };
        return data;
    } catch (error) {
        console.error("Error generating title:", error);
        return { title: "Untitled Chat" };
    }
}

export const optimizePrompt = async (messages: Message[], sessionId: string): Promise<OptimizedPromptResponse> => {
    return client.post<OptimizedPromptResponse>('/optimize-prompt', { messages, sessionId }) as unknown as Promise<OptimizedPromptResponse>;
};

export const generateImage = async (prompt: string, sessionId: string, messageId: string, config?: ImageGenerationConfig): Promise<{ imageUrls: string[], credits: number }> => {
    const data = await client.post<{ imageUrls: string[], credits: number }>('/generate-image', { prompt, config, sessionId, messageId }) as unknown as { imageUrls: string[], credits: number };
    if (!data.imageUrls || data.imageUrls.length === 0) {
        throw new Error("No image was generated.");
    }
    return data;
};
