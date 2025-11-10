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
}

export type ImageStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ImageState {
  status: ImageStatus;
  urls: string[] | null;
  prompt: string | null;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  imageState: ImageState;
  createdAt: number;
}