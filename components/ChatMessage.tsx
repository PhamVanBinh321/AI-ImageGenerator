
import React from 'react';
import type { Message, ImageGenerationConfig } from '../types';
import ConfirmIcon from './icons/ConfirmIcon';
import EditIcon from './icons/EditIcon';

interface ChatMessageProps {
  message: Message;
  onConfirm?: (prompt: string, config?: ImageGenerationConfig) => void;
  onEdit?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onConfirm, onEdit }) => {
  const isUser = message.sender === 'user';
  const isOptimizing = message.isOptimizing;

  const handleConfirm = () => {
    if (onConfirm && message.optimizedPrompt) {
      onConfirm(message.optimizedPrompt, message.imageConfig);
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-500/30 text-white p-3 rounded-lg max-w-lg shadow-md border border-blue-400/50">
          <p>{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-700/50 text-gray-200 p-4 rounded-lg max-w-lg shadow-md border border-gray-600/50">
        {isOptimizing ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Prompt gốc:</p>
              <p className="italic">"{message.originalPrompt}"</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Giải thích:</p>
              <p>{message.explanation}</p>
            </div>
            <div>
              <p className="font-semibold text-yellow-300 mb-2">Prompt đã tối ưu:</p>
              <div className="bg-gray-800/70 p-3 rounded-md border-2 border-yellow-400 shadow-inner">
                <p className="font-bold">{message.optimizedPrompt}</p>
              </div>
            </div>
            {message.imageConfig && (
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {message.imageConfig.aspectRatio && (
                  <div>
                    <span className="text-gray-400">Tỷ lệ: </span>
                    <span className="font-semibold text-gray-200 bg-gray-600/50 px-2 py-1 rounded">{message.imageConfig.aspectRatio}</span>
                  </div>
                )}
                {message.imageConfig.numberOfImages && (
                   <div>
                    <span className="text-gray-400">Số lượng: </span>
                    <span className="font-semibold text-gray-200 bg-gray-600/50 px-2 py-1 rounded">{message.imageConfig.numberOfImages}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex space-x-3 pt-3">
              <button
                onClick={handleConfirm}
                className="flex items-center justify-center px-4 py-2 bg-gradient-to-br from-purple-600 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <ConfirmIcon className="h-5 w-5 mr-2" />
                Xác nhận & Tạo ảnh
              </button>
              <button
                onClick={onEdit}
                className="flex items-center justify-center px-4 py-2 bg-gray-600/50 hover:bg-gray-500/50 text-gray-200 font-semibold rounded-lg border border-gray-500 transition-colors duration-300"
              >
                <EditIcon className="h-5 w-5 mr-2" />
                Chỉnh sửa tiếp
              </button>
            </div>
          </div>
        ) : (
          <p>{message.text}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
