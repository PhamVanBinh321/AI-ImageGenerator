export type MessageSender = 'user' | 'ai';

export interface ImageGenerationConfig {
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  numberOfImages?: number;
}

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  isOptimizing?: boolean;
  originalPrompt?: string;
  optimizedPrompt?: string;
  explanation?: string;
  imageConfig?: ImageGenerationConfig;
  imageUrls?: string[];
  imagePrompt?: string;
  imageStatus?: 'loading' | 'success' | 'error';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

// FIX: Added missing ImageState type definition.
export interface ImageState {
  status: 'idle' | 'loading' | 'success' | 'error';
  urls?: string[];
  prompt?: string;
}
