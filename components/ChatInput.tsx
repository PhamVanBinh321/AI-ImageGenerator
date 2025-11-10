
import React, { useState } from 'react';
import SendIcon from './icons/SendIcon';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-gray-800/30 backdrop-blur-sm border-t border-gray-700/50"
    >
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Nhập ý tưởng của bạn ở đây..."
          className="w-full bg-gray-700/50 text-white rounded-lg p-3 pr-14 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow duration-300"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-white disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-700 transition-all duration-300 transform hover:scale-110 disabled:scale-100 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
