import { useState } from 'react';
import type { Message, ImageGenerationConfig } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { generateTitle, optimizePrompt, generateImage } from '../api/geminiApi';

export const useChatLogic = () => {
    const { user, updateUser } = useAuth();
    const { activeSession, activeSessionId, updateSessionMessages, updateSessionTitle, updateMessageInSession } = useChat();
    const [isGenerating, setIsGenerating] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleSendMessage = async (text: string) => {
        if (!activeSession || !activeSessionId) return;
        setIsGenerating(true);

        const userMessage: Message = { id: Date.now().toString(), sender: 'user', text };
        const updatedMessages = [...activeSession.messages, userMessage];
        updateSessionMessages(activeSessionId, updatedMessages);

        if (activeSession.messages.length <= 1) { // First user message
            try {
                const { title } = await generateTitle(text, activeSessionId);
                updateSessionTitle(activeSessionId, title);
            } catch (error) {
                console.warn("Could not generate title.", error);
            }
        }

        try {
            const { optimized, explanation, config, messageId } = await optimizePrompt(updatedMessages, activeSessionId);
            const aiMessage: Message = {
                id: messageId,
                sender: 'ai',
                text: '',
                isOptimizing: true,
                originalPrompt: text,
                optimizedPrompt: optimized,
                explanation: explanation,
                imageConfig: config,
            };
            updateSessionMessages(activeSessionId, [...updatedMessages, aiMessage]);
        } catch (error: any) {
            const errorMessage = error.message || "Đã có lỗi xảy ra khi tối ưu prompt.";
            const aiError: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: '',
                isError: true,
                errorMessage,
            }
            updateSessionMessages(activeSessionId, [...updatedMessages, aiError]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmGeneration = async (prompt: string, config?: ImageGenerationConfig) => {
        if (!prompt || !activeSession || !activeSessionId || !user) return;

        // Kiểm tra credit: mỗi ảnh tốn 1 credit
        const numberOfImages = config?.numberOfImages || 1;
        if (user.credits < numberOfImages) {
            showToast(`Bạn không đủ credit. Cần ${numberOfImages} credit, nhưng bạn chỉ còn ${user.credits} credit.`);
            return;
        }

        setIsGenerating(true);

        const lastMessageIndex = activeSession.messages.length - 1;
        const lastMessage = lastMessageIndex >= 0 ? activeSession.messages[lastMessageIndex] : null;

        const imageMessageId = lastMessage?.isOptimizing ? lastMessage.id : Date.now().toString();

        const loadingMessage: Message = {
            id: imageMessageId,
            sender: 'ai',
            text: lastMessage?.text || '',
            imageStatus: 'loading',
            imagePrompt: prompt,
            imageConfig: config || lastMessage?.imageConfig,
            originalPrompt: lastMessage?.originalPrompt,
            optimizedPrompt: lastMessage?.optimizedPrompt || prompt,
            explanation: lastMessage?.explanation,
            isOptimizing: false,
        };

        let newMessages = [...activeSession.messages];
        if (lastMessageIndex >= 0 && lastMessage?.isOptimizing) {
            newMessages[lastMessageIndex] = loadingMessage;
        } else {
            newMessages.push(loadingMessage);
        }
        updateSessionMessages(activeSessionId, newMessages);

        try {
            const { imageUrls, credits: newCredits } = await generateImage(prompt, activeSessionId, imageMessageId, config);

            // Update credits in UI
            if (user) {
                updateUser({ ...user, credits: newCredits });
            }

            updateMessageInSession(activeSessionId, imageMessageId, {
                imageStatus: 'success',
                imageUrls,
                imagePrompt: prompt,
                imageConfig: config || loadingMessage.imageConfig,
                optimizedPrompt: loadingMessage.optimizedPrompt,
                explanation: loadingMessage.explanation,
                originalPrompt: loadingMessage.originalPrompt,
                isOptimizing: false,
            });
        } catch (error: any) {
            const errorMessage = error.message || "Đã có lỗi xảy ra khi tạo ảnh.";
            updateMessageInSession(activeSessionId, imageMessageId, {
                imageStatus: 'error',
                errorMessage,
                imagePrompt: prompt,
                imageConfig: config || loadingMessage.imageConfig,
                isOptimizing: false,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        isGenerating,
        handleSendMessage,
        handleConfirmGeneration,
        toastMessage,
        setToastMessage // allow manual clearing if needed
    };
};
