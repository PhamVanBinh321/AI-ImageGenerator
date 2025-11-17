import React, { useState, useEffect, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
// Fix: Import Spinner component
import Spinner from './components/Spinner';
import type { Message, ImageGenerationConfig, ChatSession, CurrentUser } from './types';
import { optimizePrompt, generateImage, generateTitle } from './services/geminiService';
import { login, signup, getMe } from './services/authService';
import { getSessions, createNewSession, deleteSession } from './services/sessionService';
import { setAuthToken } from './services/apiClient';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAuthenticating, setIsAuthenticating] = useState<boolean>(true); // For initial load
    const [toast, setToast] = useState<string | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Check for token on initial load
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                setAuthToken(token);
                try {
                    const user = await getMe();
                    setCurrentUser(user);
                } catch (error) {
                    // Token is invalid or expired
                    localStorage.removeItem('token');
                    setAuthToken(null);
                    console.error("Failed to authenticate with token", error);
                }
            }
            setIsAuthenticating(false);
        };
        loadUser();
    }, []);

    // Fetch sessions when user logs in
    useEffect(() => {
        const fetchSessions = async () => {
            if (currentUser) {
                try {
                    const userSessions = await getSessions();
                    if (userSessions && userSessions.length > 0) {
                        setSessions(userSessions);
                        setActiveSessionId(userSessions[0]._id);
                    } else {
                        // If no sessions, create one
                        handleNewChat();
                    }
                } catch (error) {
                    console.error("Failed to fetch sessions", error);
                    showToast("Không thể tải lịch sử trò chuyện.");
                }
            } else {
                // Clear sessions on logout
                setSessions([]);
                setActiveSessionId(null);
            }
        };
        fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);
    
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string) => {
        setToast(message);
    };

    const handleAuthSuccess = (data: { token: string; user: CurrentUser }) => {
        localStorage.setItem('token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
    };

    const handleLogin = async (email: string, pass: string) => {
        try {
            const data = await login(email, pass);
            handleAuthSuccess(data);
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
            return { success: false, error: errorMessage };
        }
    };

    const handleSignup = async (email: string, pass: string) => {
        try {
            const data = await signup(email, pass);
            handleAuthSuccess(data);
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
            return { success: false, error: errorMessage };
        }
    };
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        setAuthToken(null);
        setCurrentUser(null);
    };

    const activeSession = sessions.find(s => s._id === activeSessionId) || null;

    const updateSessionMessages = (sessionId: string, newMessages: Message[]) => {
        setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, messages: newMessages } : s));
    };

     const updateMessageInSession = (sessionId: string, messageId: string, updates: Partial<Message>) => {
        setSessions(prevSessions =>
            prevSessions.map(session =>
                session._id === sessionId
                    ? {
                          ...session,
                          messages: session.messages.map(msg =>
                              msg.id === messageId ? { ...msg, ...updates } : msg
                          ),
                      }
                    : session
            )
        );
    };

    const handleNewChat = useCallback(async () => {
        try {
            const newSession = await createNewSession();
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newSession._id);
            setSidebarOpen(false);
        } catch (error) {
            console.error("Failed to create new chat", error);
            showToast("Không thể tạo cuộc trò chuyện mới.");
        }
    }, []);
    
    const handleSelectChat = (id: string) => {
        setActiveSessionId(id);
        setSidebarOpen(false);
    };

    const handleDeleteChat = async (id: string) => {
        try {
            await deleteSession(id);
            const remainingSessions = sessions.filter(s => s._id !== id);
            setSessions(remainingSessions);
            if(activeSessionId === id) {
                 if (remainingSessions.length > 0) {
                    setActiveSessionId(remainingSessions[0]._id);
                 } else {
                    await handleNewChat();
                 }
            }
        } catch (error) {
            console.error("Failed to delete chat", error);
            showToast("Không thể xóa cuộc trò chuyện.");
        }
    }

    const handleSendMessage = async (text: string) => {
        if (!activeSession) return;
        setIsLoading(true);

        const userMessage: Message = { id: Date.now().toString(), sender: 'user', text };
        const updatedMessages = [...activeSession.messages, userMessage];
        updateSessionMessages(activeSession._id, updatedMessages);
        
        if (activeSession.messages.length <= 1) { // First user message
            try {
                const { title } = await generateTitle(text, activeSession._id);
                setSessions(prev => prev.map(s => s._id === activeSession._id ? { ...s, title } : s));
            } catch (error) {
                console.warn("Could not generate title.", error);
            }
        }

        try {
            const { optimized, explanation, config } = await optimizePrompt(updatedMessages, activeSession._id);
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: '',
                isOptimizing: true,
                originalPrompt: text,
                optimizedPrompt: optimized,
                explanation: explanation,
                imageConfig: config,
            };
            // The backend already saved the messages, we just update the UI
            updateSessionMessages(activeSession._id, [...updatedMessages, aiMessage]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tối ưu prompt.";
            showToast(`Lỗi: ${errorMessage}`);
            const aiError: Message = {
                id: (Date.now() + 1).toString(), sender: 'ai',
                text: 'Rất tiếc, tôi không thể xử lý yêu cầu của bạn lúc này. Vui lòng thử lại với một mô tả khác.',
            }
            updateSessionMessages(activeSession._id, [...updatedMessages, aiError]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmGeneration = async (prompt: string, config?: ImageGenerationConfig) => {
        if (!prompt || !activeSession || !currentUser) return;
        
        if (currentUser.credits < 1) {
            showToast("Bạn không đủ credit để tạo ảnh.");
            return;
        }

        setIsLoading(true);

        const imageMessageId = Date.now().toString();
        const loadingMessage: Message = {
            id: imageMessageId,
            sender: 'ai',
            text: '',
            imageStatus: 'loading',
            imagePrompt: prompt,
            imageConfig: config,
        };
        
        const lastMessageIndex = activeSession.messages.length - 1;
        let newMessages = [...activeSession.messages];
        if (lastMessageIndex >= 0 && newMessages[lastMessageIndex].isOptimizing) {
            newMessages[lastMessageIndex] = loadingMessage;
        } else {
            newMessages.push(loadingMessage);
        }
        updateSessionMessages(activeSession._id, newMessages);

        try {
            const { imageUrls, credits: newCredits } = await generateImage(prompt, activeSession._id, imageMessageId, config);
            
            // Update credits in UI
            setCurrentUser(prev => prev ? { ...prev, credits: newCredits } : null);
            
            updateMessageInSession(activeSession._id, imageMessageId, { imageStatus: 'success', imageUrls });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tạo ảnh.";
            showToast(`Lỗi: ${errorMessage}`);
            updateMessageInSession(activeSession._id, imageMessageId, { imageStatus: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isAuthenticating) {
        return (
            <div className="h-screen w-screen bg-gray-900 flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!currentUser) {
        return <Auth onLogin={handleLogin} onSignup={handleSignup} />;
    }
    
    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex overflow-hidden">
            {toast && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-red-500/80 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
                    {toast}
                </div>
            )}

            <Sidebar 
                sessions={sessions}
                activeSessionId={activeSessionId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
                isOpen={isSidebarOpen}
                user={currentUser}
                onLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 min-w-0">
                 {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-10 md:hidden"></div>}

                <div className="w-full h-full max-w-4xl mx-auto">
                    {activeSession ? (
                        <ChatPanel
                            messages={activeSession.messages}
                            isLoading={isLoading}
                            onSendMessage={handleSendMessage}
                            onConfirmGeneration={handleConfirmGeneration}
                            onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                            onRegenerate={handleConfirmGeneration}
                        />
                    ) : (
                         <div className="flex flex-col h-full bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-xl overflow-hidden shadow-2xl items-center justify-center">
                            <Spinner/>
                            <p className="mt-4 text-gray-400">Đang tải cuộc trò chuyện...</p>
                         </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;