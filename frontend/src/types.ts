export type MessageSender = 'user' | 'ai';

export interface ImageGenerationConfig {
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  numberOfImages?: number;
}

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  isError?: boolean;
  errorMessage?: string;
  isOptimizing?: boolean;
  originalPrompt?: string;
  optimizedPrompt?: string;
  explanation?: string;
  imageConfig?: ImageGenerationConfig;
  imageUrls?: string[];
  imagePrompt?: string;
  imageStatus?: 'loading' | 'success' | 'error';
  feedback?: {
    type?: 'like' | 'dislike' | null;
    reported?: boolean;
    reportedAt?: string;
  };
}

export interface ChatSession {
  _id: string; // From MongoDB
  user: string; // User ID
  title: string;
  messages: Message[];
  createdAt: string; // ISO Date string from MongoDB
  updatedAt: string; // ISO Date string from MongoDB
}


export interface User {
  _id: string;
  email: string;
  name?: string; // Optional if not always present
  credits: number;
  role: 'user' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export type CurrentUser = User; // Alias for backward compatibility if needed

export interface Transaction {
  _id: string;
  userId: string;
  packageId?: string; // Optional if not always present
  amount: number;
  credits: number;
  bonusCredits: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  orderId: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
}