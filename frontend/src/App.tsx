import React, { useState, useEffect, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import Homepage from './components/Homepage';
import ChatSearchModal from './components/ChatSearchModal';
import BuyCreditsModal from './components/BuyCreditsModal';
import PaymentModal from './components/PaymentModal';
import ProfileModal from './components/ProfileModal';
import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import Users from './components/admin/Users';
import Sessions from './components/admin/Sessions';
import Transactions from './components/admin/Transactions';
import Feedback from './components/admin/Feedback';
import Credits from './components/admin/Credits';
import Settings from './components/admin/Settings';
// Fix: Import Spinner component
import Spinner from './components/Spinner';
import type { Message, ImageGenerationConfig, ChatSession, CurrentUser } from './types';
import { optimizePrompt, generateImage, generateTitle } from './services/geminiService';
import { login, signup, getMe } from './services/authService';
import { getSessions, createNewSession, deleteSession } from './services/sessionService';
import { createPayment, checkTransaction } from './services/paymentService';
import { setAuthToken } from './services/apiClient';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAuthenticating, setIsAuthenticating] = useState<boolean>(true); // For initial load
    const [showHomepage, setShowHomepage] = useState<boolean>(true); // Show homepage by default
    const [toast, setToast] = useState<string | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [sessionsLoaded, setSessionsLoaded] = useState(false); // Track if sessions have been loaded
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [paymentData, setPaymentData] = useState<{ checkoutUrl: string | null; formFields: Record<string, string> | null; orderId: string; invoiceNumber: string } | null>(null);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null);
    const [adminPath, setAdminPath] = useState('/admin');

    // Handle admin path changes (browser navigation)
    useEffect(() => {
        const handlePathChange = () => {
            const path = window.location.pathname;
            const isAdminPath = path.startsWith('/admin');
            setIsAdminMode(isAdminPath);
            if (isAdminPath) {
                setAdminPath(path);
            } else {
                setAdminPath('/admin');
            }
        };

        // Initial check
        handlePathChange();
        
        window.addEventListener('popstate', handlePathChange);
        return () => window.removeEventListener('popstate', handlePathChange);
    }, []);

    // Check for token on initial load and check if admin route
    useEffect(() => {
        const path = window.location.pathname;
        const isAdminPath = path.startsWith('/admin');
        setIsAdminMode(isAdminPath);
        if (isAdminPath) {
            setAdminPath(path);
        }

        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                setAuthToken(token);
                try {
                    const user = await getMe();
                    if (isAdminPath) {
                        // Nếu đang ở admin path, check role
                        if (user.role === 'admin') {
                            setAdminUser({ email: user.email, role: user.role });
                        } else {
                            // Không phải admin, redirect về home
                            window.location.href = '/';
                        }
                    } else {
                        setCurrentUser(user);
                        setShowHomepage(false); // If user is already logged in, skip homepage
                    }
                } catch (error) {
                    // Token is invalid or expired
                    localStorage.removeItem('token');
                    setAuthToken(null);
                    console.error("Failed to authenticate with token", error);
                }
            } else if (isAdminPath) {
                // Ở admin path nhưng chưa có token, sẽ hiển thị AdminLogin
            }
            setIsAuthenticating(false);
        };
        loadUser();
    }, []);

    // Fetch sessions when user logs in (only once, not on every currentUser change)
    useEffect(() => {
        const fetchSessions = async () => {
            if (currentUser && !sessionsLoaded) {
                try {
                    const userSessions = await getSessions();
                    if (userSessions && userSessions.length > 0) {
                        setSessions(userSessions);
                        setActiveSessionId(userSessions[0]._id);
                    } else {
                        // If no sessions, create one
                        handleNewChat();
                    }
                    setSessionsLoaded(true);
                } catch (error) {
                    console.error("Failed to fetch sessions", error);
                    showToast("Không thể tải lịch sử trò chuyện.");
                }
            } else if (!currentUser) {
                // Clear sessions on logout
                setSessions([]);
                setActiveSessionId(null);
                setSessionsLoaded(false);
            }
        };
        fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.email]); // Only refetch when email changes (login/logout), not when credits change
    
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
        setSessionsLoaded(false); // Reset để fetch sessions mới khi login
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

    const handleBuyCreditsPackage = async (packageId: string) => {
        try {
            setIsLoading(true);
            const payment = await createPayment(packageId);
            
            setPaymentData({
                checkoutUrl: payment.checkoutUrl,
                formFields: payment.formFields,
                orderId: payment.orderId,
                invoiceNumber: payment.invoiceNumber,
            });
            
            setIsBuyCreditsOpen(false);
            setIsPaymentOpen(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tạo thanh toán.";
            showToast(`Lỗi: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaymentSuccess = async () => {
        // Refresh user data để lấy credits mới
        try {
            const user = await getMe();
            setCurrentUser(user);
            setIsPaymentOpen(false);
            setPaymentData(null);
            showToast('Thanh toán thành công! Credit đã được cộng vào tài khoản.');
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    };

    // Xử lý payment callbacks từ URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const invoiceNumber = urlParams.get('invoice_number');
        const orderId = urlParams.get('order_id');
        
        // Kiểm tra nếu có invoice_number (từ success callback)
        if (invoiceNumber) {
            const checkTransactionStatus = async () => {
                try {
                    // Polling để đợi IPN xử lý (tối đa 10 lần, mỗi lần 2 giây)
                    let attempts = 0;
                    const maxAttempts = 10;
                    
                    const poll = async () => {
                        attempts++;
                        const result = await checkTransaction(invoiceNumber);
                        
                        if (result.status === 'completed' && result.credits !== null) {
                            // Transaction đã completed, refresh user data
                            const user = await getMe();
                            setCurrentUser(user);
                            showToast('Thanh toán thành công! Credit đã được cộng vào tài khoản.');
                            // Clean URL
                            window.history.replaceState({}, document.title, window.location.pathname);
                        } else if (attempts < maxAttempts) {
                            // Chưa completed, đợi thêm
                            setTimeout(poll, 2000);
                        } else {
                            // Timeout, vẫn refresh user data để kiểm tra
                            const user = await getMe();
                            setCurrentUser(user);
                            showToast('Đang xử lý thanh toán. Credit sẽ được cộng trong vài giây.');
                            window.history.replaceState({}, document.title, window.location.pathname);
                        }
                    };
                    
                    poll();
                } catch (error) {
                    console.error('Error checking transaction:', error);
                    // Vẫn refresh user data
                    getMe().then(user => {
                        setCurrentUser(user);
                        showToast('Đang xử lý thanh toán. Vui lòng đợi vài giây.');
                    });
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            };
            
            checkTransactionStatus();
        } else if (orderId) {
            // Fallback nếu chỉ có order_id
            handlePaymentSuccess();
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleConfirmGeneration = async (prompt: string, config?: ImageGenerationConfig) => {
        if (!prompt || !activeSession || !currentUser) return;
        
        // Kiểm tra credit: mỗi ảnh tốn 1 credit
        const numberOfImages = config?.numberOfImages || 1;
        if (currentUser.credits < numberOfImages) {
            showToast(`Bạn không đủ credit. Cần ${numberOfImages} credit để tạo ${numberOfImages} ảnh, nhưng bạn chỉ còn ${currentUser.credits} credit.`);
            setIsBuyCreditsOpen(true); // Mở modal mua credit khi thiếu
            return;
        }

        setIsLoading(true);

        const lastMessageIndex = activeSession.messages.length - 1;
        const lastMessage = lastMessageIndex >= 0 ? activeSession.messages[lastMessageIndex] : null;
        
        // Sử dụng ID của message hiện tại nếu đang optimize, hoặc tạo ID mới
        const imageMessageId = lastMessage?.isOptimizing ? lastMessage.id : Date.now().toString();
        
        // Tạo loading message, giữ lại tất cả thông tin từ message cũ nếu có
        const loadingMessage: Message = {
            id: imageMessageId,
            sender: 'ai',
            text: lastMessage?.text || '',
            imageStatus: 'loading',
            imagePrompt: prompt,
            imageConfig: config || lastMessage?.imageConfig,
            // Giữ lại thông tin từ message optimizing nếu có
            originalPrompt: lastMessage?.originalPrompt,
            optimizedPrompt: lastMessage?.optimizedPrompt || prompt,
            explanation: lastMessage?.explanation,
            isOptimizing: false, // Đảm bảo không còn ở trạng thái optimizing
        };
        
        let newMessages = [...activeSession.messages];
        if (lastMessageIndex >= 0 && lastMessage?.isOptimizing) {
            // Thay thế message optimizing bằng loading message
            newMessages[lastMessageIndex] = loadingMessage;
        } else {
            // Thêm message mới nếu không có message optimizing
            newMessages.push(loadingMessage);
        }
        updateSessionMessages(activeSession._id, newMessages);

        try {
            const { imageUrls, credits: newCredits } = await generateImage(prompt, activeSession._id, imageMessageId, config);
            
            // Update credits in UI
            setCurrentUser(prev => prev ? { ...prev, credits: newCredits } : null);
            
            // Cập nhật message với ảnh, giữ lại tất cả thông tin
            updateMessageInSession(activeSession._id, imageMessageId, { 
                imageStatus: 'success', 
                imageUrls,
                // Đảm bảo giữ lại các thông tin quan trọng
                imagePrompt: prompt,
                imageConfig: config || loadingMessage.imageConfig,
                optimizedPrompt: loadingMessage.optimizedPrompt,
                explanation: loadingMessage.explanation,
                originalPrompt: loadingMessage.originalPrompt,
                // Đảm bảo không còn ở trạng thái optimizing
                isOptimizing: false,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tạo ảnh.";
            showToast(`Lỗi: ${errorMessage}`);
            // Cập nhật lỗi nhưng vẫn giữ lại thông tin
            updateMessageInSession(activeSession._id, imageMessageId, { 
                imageStatus: 'error',
                imagePrompt: prompt,
                imageConfig: config || loadingMessage.imageConfig,
                // Đảm bảo không còn ở trạng thái optimizing
                isOptimizing: false,
            });
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

    // Admin mode - render admin interface
    if (isAdminMode) {
        if (!adminUser) {
            return (
                <AdminLogin 
                    onLoginSuccess={(user) => {
                        setAdminUser(user);
                        setAuthToken(localStorage.getItem('token'));
                    }}
                />
            );
        }
        
        const renderAdminContent = () => {
            if (adminPath === '/admin' || adminPath === '/admin/') {
                return <Dashboard />;
            }
            if (adminPath === '/admin/users') {
                return <Users />;
            }
            if (adminPath === '/admin/sessions') {
                return <Sessions />;
            }
            if (adminPath === '/admin/transactions') {
                return <Transactions />;
            }
            if (adminPath === '/admin/feedback') {
                return <Feedback />;
            }
            if (adminPath === '/admin/credits') {
                return <Credits />;
            }
            if (adminPath === '/admin/settings') {
                return <Settings />;
            }
            return (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
                    <p className="text-gray-400">Trang này không tồn tại.</p>
                </div>
            );
        };

        return (
            <AdminLayout 
                currentUser={adminUser}
                currentPath={adminPath}
                onLogout={() => {
                    setAdminUser(null);
                    setCurrentUser(null);
                    setAuthToken(null);
                }}
                onNavigate={(path) => {
                    setAdminPath(path);
                }}
            >
                {renderAdminContent()}
            </AdminLayout>
        );
    }

    // Show homepage if user hasn't clicked "Get Started" yet
    if (showHomepage && !currentUser) {
        return <Homepage onGetStarted={() => setShowHomepage(false)} />;
    }

    // Show auth if user clicked "Get Started" but not logged in
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
                onSearchClick={() => setIsSearchOpen(true)}
                onBuyCredits={() => setIsBuyCreditsOpen(true)}
                onProfileClick={() => setIsProfileOpen(true)}
            />

            <ChatSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                sessions={sessions}
                onSelectSession={(id) => {
                    handleSelectChat(id);
                    setIsSearchOpen(false);
                }}
            />

            <BuyCreditsModal
                isOpen={isBuyCreditsOpen}
                onClose={() => setIsBuyCreditsOpen(false)}
                currentCredits={currentUser?.credits || 0}
                onSelectPackage={handleBuyCreditsPackage}
            />

            {paymentData && (
                <PaymentModal
                    isOpen={isPaymentOpen}
                    onClose={() => {
                        setIsPaymentOpen(false);
                        setPaymentData(null);
                    }}
                    checkoutUrl={paymentData.checkoutUrl}
                    formFields={paymentData.formFields}
                    orderId={paymentData.orderId}
                    invoiceNumber={paymentData.invoiceNumber}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                currentUser={currentUser}
                onUserUpdate={(user) => {
                    setCurrentUser(user);
                    // Refresh user data
                    getMe().then(updatedUser => setCurrentUser(updatedUser)).catch(console.error);
                }}
                onLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 min-w-0">
                 {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-10 md:hidden"></div>}

                <div className="w-full h-full">
                    {activeSession ? (
                        <ChatPanel
                            messages={activeSession.messages}
                            isLoading={isLoading}
                            sessionId={activeSessionId}
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