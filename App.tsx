
import React, { useState, useEffect, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import type { Message, ImageGenerationConfig, ChatSession } from './types';
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
};

// NOTE: This is a simulation. In a real app, never store passwords in localStorage.
// Use a secure backend for authentication.
interface UserRecord {
    email: string;
    // Storing password directly for this simulation
    password: string;
    credits: number;
}

interface CurrentUser {
    email: string;
    credits: number;
}

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [toast, setToast] = useState<string | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const loggedInUserEmail = localStorage.getItem('currentUser');
        if (loggedInUserEmail) {
            const users: UserRecord[] = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === loggedInUserEmail);
            if (user) {
                setCurrentUser({ email: user.email, credits: user.credits });
            } else {
                 // Data inconsistency, log out user
                localStorage.removeItem('currentUser');
            }
        }
    }, []);

    // Load sessions from localStorage when the current user's email changes (i.e., on login)
    useEffect(() => {
        if (!currentUser) {
            setSessions([]);
            setActiveSessionId(null);
            return;
        }

        try {
            const storedSessions = localStorage.getItem(`chatSessions_${currentUser.email}`);
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
    }, [currentUser?.email]);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (currentUser && sessions.length > 0) {
            localStorage.setItem(`chatSessions_${currentUser.email}`, JSON.stringify(sessions));
        } else if (currentUser) {
             localStorage.removeItem(`chatSessions_${currentUser.email}`);
        }
    }, [sessions, currentUser]);
    
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleLogin = async (email: string, pass: string) => {
        const users: UserRecord[] = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email);
        if (user && user.password === pass) {
            localStorage.setItem('currentUser', email);
            setCurrentUser({ email: user.email, credits: user.credits });
            return { success: true };
        }
        return { success: false, error: 'Email hoặc mật khẩu không chính xác.' };
    };

    const handleSignup = async (email: string, pass: string) => {
        const users: UserRecord[] = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some(u => u.email === email)) {
            return { success: false, error: 'Email này đã được sử dụng.' };
        }
        // New users get 10 credits
        users.push({ email, password: pass, credits: 10 });
        localStorage.setItem('users', JSON.stringify(users));
        return handleLogin(email, pass);
    };
    
    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
    };

    const activeSession = sessions.find(s => s.id === activeSessionId) || null;

    const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
        setSessions(prevSessions =>
            prevSessions.map(session =>
                session.id === sessionId ? { ...session, ...updates } : session
            )
        );
    };

    const updateMessageInSession = (sessionId: string, messageId: string, updates: Partial<Message>) => {
        setSessions(prevSessions =>
            prevSessions.map(session =>
                session.id === sessionId
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

    const handleNewChat = useCallback(() => {
        const newSession: ChatSession = {
            ...initialSession,
            id: `session-${Date.now()}`,
            createdAt: Date.now(),
             messages: [initialSession.messages[0]] // ensure fresh messages array
        };
        setSessions(prev => [newSession, ...prev].sort((a,b) => b.createdAt - a.createdAt));
        setActiveSessionId(newSession.id);
        setSidebarOpen(false);
    }, []);
    
    const handleSelectChat = (id: string) => {
        setActiveSessionId(id);
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

        const userMessage: Message = { id: Date.now().toString(), sender: 'user', text };
        
        const currentMessagesWithoutOldSuggestions = activeSession.messages.map(msg => 
            msg.isOptimizing ? { ...msg, isOptimizing: false, text: `Prompt đã cũ: ${msg.optimizedPrompt}` } : msg
        );
        
        const updatedMessages = [...currentMessagesWithoutOldSuggestions, userMessage];
        updateSession(activeSession.id, { messages: updatedMessages });
        
        if (activeSession.messages.length <= 1) {
            const title = await generateTitle(text);
            updateSession(activeSession.id, { title });
        }

        try {
            const { optimized, explanation, config } = await optimizePrompt(updatedMessages);
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
            updateSession(activeSession.id, { messages: [...updatedMessages, aiMessage] });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tối ưu prompt.";
            showToast(`Lỗi: ${errorMessage}`);
            const aiError: Message = {
                id: (Date.now() + 1).toString(), sender: 'ai',
                text: 'Rất tiếc, tôi không thể xử lý yêu cầu của bạn lúc này. Vui lòng thử lại với một mô tả khác.',
            }
            updateSession(activeSession.id, { messages: [...updatedMessages, aiError] });
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

        updateSession(activeSession.id, { messages: newMessages });

        try {
            const imageUrls = await generateImage(prompt, config);
            
            // Deduct credit on success
            const updatedUser = { ...currentUser, credits: currentUser.credits - 1 };
            setCurrentUser(updatedUser);
            
            // Persist credit change
            const users: UserRecord[] = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.email === currentUser.email);
            if(userIndex !== -1) {
                users[userIndex].credits = updatedUser.credits;
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            updateMessageInSession(activeSession.id, imageMessageId, { imageStatus: 'success', imageUrls });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tạo ảnh.";
            showToast(`Lỗi: ${errorMessage}`);
            updateMessageInSession(activeSession.id, imageMessageId, { imageStatus: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!currentUser) {
        return <Auth onLogin={handleLogin} onSignup={handleSignup} />;
    }
    
    const displayedMessages = activeSession?.messages || [];

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
                    <ChatPanel
                        messages={displayedMessages}
                        isLoading={isLoading}
                        onSendMessage={handleSendMessage}
                        onConfirmGeneration={handleConfirmGeneration}
                        onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                        onRegenerate={handleConfirmGeneration}
                    />
                </div>
            </main>
        </div>
    );
};

export default App;
