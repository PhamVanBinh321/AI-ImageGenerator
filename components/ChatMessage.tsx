import React from 'react';
import type { Message, ImageGenerationConfig } from '../types';
import ConfirmIcon from './icons/ConfirmIcon';
import EditIcon from './icons/EditIcon';
import Spinner from './Spinner';
import DownloadIcon from './icons/DownloadIcon';
import RefreshIcon from './icons/RefreshIcon';

interface ChatMessageProps {
  message: Message;
  onConfirm?: (prompt: string, config?: ImageGenerationConfig) => void;
  onRegenerate?: (prompt: string, config?: ImageGenerationConfig) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onConfirm, onRegenerate }) => {
  const isUser = message.sender === 'user';

  const handleConfirm = () => {
    if (onConfirm && message.optimizedPrompt) {
      onConfirm(message.optimizedPrompt, message.imageConfig);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate && message.imagePrompt) {
        onRegenerate(message.imagePrompt, message.imageConfig);
    }
  }

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="bg-gray-700/50 text-gray-200 p-4 rounded-lg max-w-lg shadow-md border border-gray-600/50 w-full">
        {message.isOptimizing ? (
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
            </div>
          </div>
        ) : message.imageStatus ? (
          <div>
            {message.imageStatus === 'loading' && (
              <div className="flex flex-col items-center justify-center text-center text-gray-400 p-4">
                <Spinner className="mb-4 h-8 w-8" />
                <p className="font-semibold">Đang tạo ảnh từ prompt:</p>
                <p className="text-sm italic mt-1">"{message.imagePrompt}"</p>
              </div>
            )}
            {message.imageStatus === 'success' && message.imageUrls && (
              <div className="w-full flex flex-col">
                <p className="text-sm text-gray-400 mb-2">Kết quả cho prompt:</p>
                <p className="text-sm text-gray-200 italic mb-4">"{message.imagePrompt}"</p>
                <div className="grid grid-cols-2 gap-2">
                  {message.imageUrls.map((url, index) => (
                    <div key={index} className="relative group w-full aspect-square">
                      <img 
                        src={url} 
                        alt={`AI generated image ${index + 1}`} 
                        className="w-full h-full object-cover rounded-lg shadow-lg" 
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-lg">
                        <button onClick={() => handleDownload(url)} className="flex items-center px-3 py-1.5 bg-white/20 backdrop-blur-md text-white font-semibold rounded-lg hover:bg-white/30 transition-colors text-sm">
                          <DownloadIcon className="h-4 w-4 mr-1.5" />
                          Tải
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {message.imageStatus === 'error' && (
              <div className="flex flex-col items-center justify-center text-center text-red-400 p-4">
                <p className="font-semibold">Tạo ảnh thất bại</p>
                <p className="text-sm mt-1">Đã có lỗi xảy ra với prompt:</p>
                <p className="text-sm italic mt-1">"{message.imagePrompt}"</p>
                <button 
                  onClick={handleRegenerate}
                  className="mt-4 flex items-center justify-center px-4 py-2 bg-red-600/50 hover:bg-red-500/50 text-red-100 font-semibold rounded-lg border border-red-500 transition-colors duration-300"
                >
                  <RefreshIcon className="h-5 w-5 mr-2" />
                  Thử lại
                </button>
              </div>
            )}
          </div>
        ) : (
          <p>{message.text}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;