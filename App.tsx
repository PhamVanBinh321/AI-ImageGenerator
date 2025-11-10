import React, { useState, useEffect, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import ImagePreviewPanel from './components/ImagePreviewPanel';
import Sidebar from './components/Sidebar';
import type { Message, ImageState, ImageGenerationConfig, ChatSession } from './types';
import { optimizePrompt, generateImage, generateTitle } from './services/geminiService';

const initialSession: ChatSession = {
    id: 'init-session',
    title: 'Cuộc trò chuyện mới',
    createdAt: Date.now(),
    messages: [
        {
          id: 'init',
          sender: 'ai',
          text: 'Chào bạn! Hãy cho tôi biết ý tưởng về bức ảnh bạn muốn tạo. Bạn có thể yêu cầu nhiều ảnh hoặc tỷ lệ cụ thể (vd: "một chú mèo phi hành gia, 16:9, 2 phiên bản").',
        },
    ],
    imageState: {
        status: 'idle',
        urls: null,
        prompt: null,
    },
};

const App: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [toast, setToast] = useState<string | null>(null);
    const [activeSuggestion, setActiveSuggestion] = useState<ImageGenerationConfig & { prompt: string } | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Load sessions from localStorage on initial render
    useEffect(() => {
        try {
            const storedSessions = localStorage.getItem('chatSessions');
            if (storedSessions) {
                const parsedSessions = JSON.parse(storedSessions);
                if(parsedSessions.length > 0) {
                    setSessions(parsedSessions);
                    setActiveSessionId(parsedSessions[0].id);
                } else {
                    handleNewChat();
                }
            } else {
                handleNewChat();
            }
        } catch (error) {
            console.error("Failed to load sessions from localStorage", error);
            handleNewChat();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if(sessions.length > 0) {
            localStorage.setItem('chatSessions', JSON.stringify(sessions));
        }
    }, [sessions]);
    
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const activeSession = sessions.find(s => s.id === activeSessionId) || null;

    const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
        setSessions(prevSessions =>
            prevSessions.map(session =>
                session.id === sessionId ? { ...session, ...updates } : session
            )
        );
    };

    const handleNewChat = useCallback(() => {
        const newSession: ChatSession = {
            ...initialSession,
            id: `session-${Date.now()}`,
            createdAt: Date.now(),
             messages: [initialSession.messages[0]] // ensure fresh messages array
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setSidebarOpen(false);
    }, []);
    
    const handleSelectChat = (id: string) => {
        setActiveSessionId(id);
        setActiveSuggestion(null); // Clear suggestion when switching chats
        setSidebarOpen(false);
    };

    const handleDeleteChat = (id: string) => {
        const remainingSessions = sessions.filter(s => s.id !== id);
        setSessions(remainingSessions);
        if(activeSessionId === id) {
             if (remainingSessions.length > 0) {
                setActiveSessionId(remainingSessions[0].id);
             } else {
                handleNewChat();
             }
        }
    }

    const showToast = (message: string) => {
        setToast(message);
    };

    const handleSendMessage = async (text: string) => {
        if (!activeSession) return;

        setIsLoading(true);
        setActiveSuggestion(null);
        const userMessage: Message = { id: Date.now().toString(), sender: 'user', text };
        
        let currentMessages = [...activeSession.messages, userMessage];
        updateSession(activeSession.id, { messages: currentMessages });
        
        // Generate title for new chats
        if (activeSession.messages.length <= 1) { // <=1 because we just added the user message
            const title = await generateTitle(text);
            updateSession(activeSession.id, { title });
        }

        try {
            const { optimized, explanation, config } = await optimizePrompt(text);
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
            updateSession(activeSession.id, { messages: [...currentMessages, aiMessage] });
            setActiveSuggestion({ prompt: optimized, ...config });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tối ưu prompt.";
            showToast(`Lỗi: ${errorMessage}`);
            const aiError: Message = {
                id: (Date.now() + 1).toString(), sender: 'ai',
                text: 'Rất tiếc, tôi không thể xử lý yêu cầu của bạn lúc này. Vui lòng thử lại với một mô tả khác.',
            }
            updateSession(activeSession.id, { messages: [...currentMessages, aiError] });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmGeneration = async (prompt: string, config?: ImageGenerationConfig) => {
        if (!prompt || !activeSession) return;

        setIsLoading(true);
        const newImageState: ImageState = { status: 'loading', urls: null, prompt: prompt };
        updateSession(activeSession.id, { imageState: newImageState });
        setActiveSuggestion(null);

        try {
            const imageUrls = await generateImage(prompt, config);
            updateSession(activeSession.id, { imageState: { status: 'success', urls: imageUrls, prompt: prompt } });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tạo ảnh.";
            showToast(`Lỗi: ${errorMessage}`);
            updateSession(activeSession.id, { imageState: { status: 'error', urls: null, prompt: prompt } });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditPrompt = () => {
        if (!activeSession) return;
        setActiveSuggestion(null);
        const aiMessage: Message = {
            id: Date.now().toString(), sender: 'ai',
            text: 'Được thôi, hãy cho tôi biết bạn muốn thay đổi điều gì hoặc gửi một ý tưởng mới.'
        };
        updateSession(activeSession.id, { messages: [...activeSession.messages, aiMessage] });
    };

    const handleRetryPrompt = () => {
        if (!activeSession) return;
        updateSession(activeSession.id, { imageState: { status: 'idle', urls: null, prompt: null } });
        const aiMessage: Message = {
            id: Date.now().toString(), sender: 'ai',
            text: 'Hãy nhập một prompt mới hoặc chỉnh sửa prompt trước đó nhé.'
        };
        updateSession(activeSession.id, { messages: [...activeSession.messages, aiMessage] });
    }
    
    const displayedMessages = activeSession?.messages.map(msg => 
        msg.isOptimizing && msg.optimizedPrompt !== activeSuggestion?.prompt 
        ? {...msg, isOptimizing: false, text: 'Vui lòng thực hiện một lựa chọn để tiếp tục.'} 
        : msg
    ) || [];

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
            />

            <main className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8 p-4 md:p-6 lg:p-8 min-w-0">
                 {/* Overlay for mobile */}
                 {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-10 md:hidden"></div>}

                <div className="w-full md:w-3/5 lg:w-3/5 h-1/2 md:h-full min-h-0">
                    <ChatPanel
                        messages={displayedMessages}
                        isLoading={isLoading}
                        onSendMessage={handleSendMessage}
                        onConfirmGeneration={handleConfirmGeneration}
                        onEditPrompt={handleEditPrompt}
                        onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                    />
                </div>
                <div className="w-full md:w-2/5 lg:w-2/5 h-1/2 md:h-full min-h-0">
                    <ImagePreviewPanel imageState={activeSession?.imageState ?? initialSession.imageState} onRetry={handleRetryPrompt} />
                </div>
            </main>
        </div>
    );
};

export default App;