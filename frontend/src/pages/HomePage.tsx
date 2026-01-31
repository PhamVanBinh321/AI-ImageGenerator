import React, { useState, useEffect } from 'react';
import ChatPanel from '../features/chat/ChatPanel';
import ChatSidebar from '../features/chat/ChatSidebar';
import BuyCreditsModal from '../features/payment/BuyCreditsModal';
import PaymentModal from '../features/payment/PaymentModal';
import ChatSearchModal from '../features/chat/ChatSearchModal';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useChatLogic } from '../hooks/useChatLogic';
import { createPayment } from '../api/paymentApi';

import ProfileModal from '../features/auth/ProfileModal';

const HomePage: React.FC = () => {
    const { user, updateUser, logout } = useAuth();
    const { sessions, activeSession, activeSessionId, isLoading: isChatLoading, loadSessions, selectChat } = useChat();
    const { isGenerating, handleSendMessage, handleConfirmGeneration, toastMessage } = useChatLogic();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Payment State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState<{
        checkoutUrl: string;
        formFields: Record<string, string>;
        orderId: string;
        invoiceNumber: string;
    } | null>(null);

    useEffect(() => {
        loadSessions();
    }, []);

    const handleSelectPackage = async (packageId: string) => {
        try {
            const data = await createPayment(packageId);
            setPaymentData({
                checkoutUrl: data.checkoutUrl,
                formFields: data.formFields,
                orderId: data.orderId,
                invoiceNumber: data.invoiceNumber,
            });
            setIsBuyModalOpen(false); // Close buy modal
            setIsPaymentModalOpen(true); // Open payment redirect modal
        } catch (error) {
            console.error("Payment failed", error);
            alert("Lỗi tạo thanh toán. Vui lòng thử lại.");
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <ChatSidebar
                isOpen={isSidebarOpen}
                onSearchClick={() => setIsSearchModalOpen(true)}
                onBuyCredits={() => setIsBuyModalOpen(true)}
                onProfileClick={() => setIsProfileModalOpen(true)}
            />

            {/* Main Chat Area */}
            <main className="flex-1 min-w-0 flex flex-col h-full relative">
                <ChatPanel
                    messages={activeSession ? activeSession.messages : []}
                    isLoading={isGenerating || isChatLoading}
                    sessionId={activeSessionId}
                    onSendMessage={handleSendMessage}
                    onConfirmGeneration={handleConfirmGeneration}
                    onRegenerate={handleConfirmGeneration} // Using same handler for regenerate for now
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="absolute top-4 right-4 z-50 animate-fade-in-down">
                        <div className="bg-gray-800 border border-purple-500/50 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center shadow-purple-500/20">
                            <svg className="w-6 h-6 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="font-medium">{toastMessage}</span>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            <ChatSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                sessions={sessions}
                onSelectSession={selectChat}
            />

            <BuyCreditsModal
                isOpen={isBuyModalOpen}
                onClose={() => setIsBuyModalOpen(false)}
                currentCredits={user?.credits || 0}
                onSelectPackage={handleSelectPackage}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                checkoutUrl={paymentData?.checkoutUrl || null}
                formFields={paymentData?.formFields || null}
                orderId={paymentData?.orderId || ''}
                invoiceNumber={paymentData?.invoiceNumber || ''}
            />

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                currentUser={user}
                onUserUpdate={(updatedUser) => updateUser(updatedUser)}
                onLogout={logout}
            />
        </div>
    );
};

export default HomePage;
