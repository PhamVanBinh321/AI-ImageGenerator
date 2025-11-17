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
  _id: string; // From MongoDB
  user: string; // User ID
  title: string;
  messages: Message[];
  createdAt: string; // ISO Date string from MongoDB
  updatedAt: string; // ISO Date string from MongoDB
}


export interface CurrentUser {
    email: string;
    credits: number;
}