import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ChatSession, Message } from '../types';
import { getSessions, createNewSession, deleteSession } from '../api/sessionApi';
import { useAuth } from './AuthContext';

interface ChatContextType {
    sessions: ChatSession[];
    activeSessionId: string | null;
    activeSession: ChatSession | null;
    isLoading: boolean;
    loadSessions: () => Promise<void>;
    createNewChat: () => Promise<void>;
    selectChat: (id: string) => void;
    deleteChat: (id: string) => Promise<void>;
    updateSessionMessages: (sessionId: string, messages: Message[]) => void;
    updateMessageInSession: (sessionId: string, messageId: string, updates: Partial<Message>) => void;
    updateSessionTitle: (sessionId: string, title: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const activeSession = sessions.find(s => s._id === activeSessionId) || null;

    const loadSessions = async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const data = await getSessions();
            setSessions(data);
            if (data.length > 0 && !activeSessionId) {
                setActiveSessionId(data[0]._id);
            } else if (data.length === 0) {
                await createNewChat();
            }
        } catch (error) {
            console.error("Failed to load sessions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const createNewChat = async () => {
        try {
            const newSession = await createNewSession();
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newSession._id);
        } catch (error) {
            console.error("Failed to create session", error);
            throw error;
        }
    };

    const selectChat = (id: string) => {
        setActiveSessionId(id);
    };

    const deleteChat = async (id: string) => {
        try {
            await deleteSession(id);
            setSessions(prev => prev.filter(s => s._id !== id));
            if (activeSessionId === id) {
                const remaining = sessions.filter(s => s._id !== id);
                if (remaining.length > 0) {
                    setActiveSessionId(remaining[0]._id);
                } else {
                    await createNewChat();
                }
            }
        } catch (error) {
            console.error("Failed to delete session", error);
            throw error;
        }
    };

    const updateSessionMessages = (sessionId: string, messages: Message[]) => {
        setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, messages } : s));
    };

    const updateMessageInSession = (sessionId: string, messageId: string, updates: Partial<Message>) => {
        setSessions(prev => prev.map(s =>
            s._id === sessionId ? {
                ...s,
                messages: s.messages.map(m => m.id === messageId ? { ...m, ...updates } : m)
            } : s
        ));
    };

    const updateSessionTitle = (sessionId: string, title: string) => {
        setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, title } : s));
    };

    return (
        <ChatContext.Provider value={{
            sessions,
            activeSessionId,
            activeSession,
            isLoading,
            loadSessions,
            createNewChat,
            selectChat,
            deleteChat,
            updateSessionMessages,
            updateMessageInSession,
            updateSessionTitle
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
