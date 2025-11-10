import React, { useRef, useEffect } from 'react';
import type { Message, ImageGenerationConfig } from '../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import MenuIcon from './icons/MenuIcon';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onConfirmGeneration: (prompt: string, config?: ImageGenerationConfig) => void;
  onEditPrompt: () => void;
  onToggleSidebar: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onConfirmGeneration,
  onEditPrompt,
  onToggleSidebar,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-xl overflow-hidden shadow-2xl">
      <header className="flex items-center justify-between p-4 bg-gray-900/40 border-b border-gray-700/50">
        <button onClick={onToggleSidebar} className="md:hidden p-2 text-gray-300 hover:text-white">
          <MenuIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 text-center flex-1 md:flex-none">
          AI Image Generator
        </h1>
        <div className="w-8 md:hidden"></div> {/* Spacer to center title */}
      </header>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onConfirm={onConfirmGeneration}
            onEdit={onEditPrompt}
          />
        ))}
         {isLoading && messages[messages.length-1]?.sender === 'user' && (
            <div className="flex justify-start mb-4">
                <div className="bg-gray-700/50 text-gray-200 p-4 rounded-lg max-w-lg shadow-md border border-gray-600/50 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300"></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatPanel;