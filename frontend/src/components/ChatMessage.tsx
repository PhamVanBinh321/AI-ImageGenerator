import React, { useState, useEffect } from 'react';
import type { Message, ImageGenerationConfig } from '../types';
import ConfirmIcon from './icons/ConfirmIcon';
import Spinner from './Spinner';
import DownloadIcon from './icons/DownloadIcon';
import RefreshIcon from './icons/RefreshIcon';
import { updateMessageFeedback, reportMessage } from '../services/sessionService';

interface ChatMessageProps {
  message: Message;
  sessionId: string | null;
  onConfirm?: (prompt: string, config?: ImageGenerationConfig) => void;
  onRegenerate?: (prompt: string, config?: ImageGenerationConfig) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, sessionId, onConfirm, onRegenerate }) => {
  const isUser = message.sender === 'user';
  // Load feedback từ message.feedback khi component mount
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(
    message.feedback?.type || null
  );
  const [isReported, setIsReported] = useState(message.feedback?.reported || false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isUpdatingFeedback, setIsUpdatingFeedback] = useState(false);

  // Cập nhật feedback khi message.feedback thay đổi
  useEffect(() => {
    setFeedback(message.feedback?.type || null);
    setIsReported(message.feedback?.reported || false);
  }, [message.feedback]);

  // Icon components sử dụng Material Symbols
  const LikeIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
    <span 
      className={`material-symbols-outlined ${className || ''}`} 
      style={{ 
        fontVariationSettings: filled ? '"FILL" 1' : '"FILL" 0',
        fontSize: 'inherit',
        lineHeight: '1',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      thumb_up
    </span>
  );

  const DislikeIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
    <span 
      className={`material-symbols-outlined ${className || ''}`} 
      style={{ 
        fontVariationSettings: filled ? '"FILL" 1' : '"FILL" 0',
        fontSize: 'inherit',
        lineHeight: '1',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      thumb_down
    </span>
  );

  const ReportIcon = ({ className }: { className?: string }) => (
    <span 
      className={`material-symbols-outlined ${className || ''}`}
      style={{
        fontSize: 'inherit',
        lineHeight: '1',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      report
    </span>
  );

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

  const handleLike = async () => {
    if (!sessionId || isUser) return;
    
    const newFeedback = feedback === 'like' ? null : 'like';
    setIsUpdatingFeedback(true);
    
    try {
      await updateMessageFeedback(sessionId, message.id, newFeedback);
      setFeedback(newFeedback);
    } catch (error) {
      console.error('Error updating feedback:', error);
      // Revert on error
      setFeedback(feedback);
    } finally {
      setIsUpdatingFeedback(false);
    }
  };

  const handleDislike = async () => {
    if (!sessionId || isUser) return;
    
    const newFeedback = feedback === 'dislike' ? null : 'dislike';
    setIsUpdatingFeedback(true);
    
    try {
      await updateMessageFeedback(sessionId, message.id, newFeedback);
      setFeedback(newFeedback);
    } catch (error) {
      console.error('Error updating feedback:', error);
      // Revert on error
      setFeedback(feedback);
    } finally {
      setIsUpdatingFeedback(false);
    }
  };

  const handleReport = () => {
    if (isReported) return; // Đã báo cáo rồi thì không cho báo cáo lại
    setShowReportModal(true);
  };

  const handleConfirmReport = async () => {
    if (!sessionId || isUser) return;
    
    try {
      await reportMessage(sessionId, message.id);
      setIsReported(true);
      setShowReportModal(false);
      alert('Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét tin nhắn này.');
    } catch (error) {
      console.error('Error reporting message:', error);
      alert('Có lỗi xảy ra khi báo cáo. Vui lòng thử lại.');
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-500/30 text-white p-3 rounded-lg max-w-2xl shadow-md border border-blue-400/50">
          <p>{message.text}</p>
        </div>
      </div>
    );
  }

  // Kiểm tra xem đã có image results chưa
  const hasImageResults = message.imageStatus === 'success' && message.imageUrls && message.imageUrls.length > 0;

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-700/50 text-gray-200 p-4 rounded-lg max-w-4xl shadow-md border border-gray-600/50 w-full">
        {/* Nếu đã có image results → chỉ hiển thị image results */}
        {hasImageResults ? (
          <div className="w-full flex flex-col">
            <p className="text-sm text-gray-400 mb-2">Kết quả cho prompt:</p>
            <p className="text-sm text-gray-200 italic mb-4">"{message.imagePrompt || message.optimizedPrompt}"</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            {/* Feedback buttons cho image results */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-600/50">
              <button
                onClick={handleLike}
                disabled={isUpdatingFeedback || !sessionId}
                className={`flex items-center justify-center px-2 py-1 rounded text-xs transition-colors ${
                  feedback === 'like'
                    ? 'text-green-400 bg-green-400/20'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
                } ${isUpdatingFeedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={feedback === 'like' ? 'Gỡ like' : 'Hữu ích'}
              >
                <LikeIcon className="text-base leading-none" filled={feedback === 'like'} />
              </button>
              <button
                onClick={handleDislike}
                disabled={isUpdatingFeedback || !sessionId}
                className={`flex items-center justify-center px-2 py-1 rounded text-xs transition-colors ${
                  feedback === 'dislike'
                    ? 'text-red-400 bg-red-400/20'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
                } ${isUpdatingFeedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={feedback === 'dislike' ? 'Gỡ dislike' : 'Không hữu ích'}
              >
                <DislikeIcon className="text-base leading-none" filled={feedback === 'dislike'} />
              </button>
              <button
                onClick={handleReport}
                disabled={isReported || !sessionId}
                className={`flex items-center justify-center px-2 py-1 rounded text-xs transition-colors ${
                  isReported 
                    ? 'text-gray-500 cursor-not-allowed opacity-50' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
                }`}
                title={isReported ? 'Đã báo cáo' : 'Báo cáo tin nhắn'}
              >
                <ReportIcon className="text-base leading-none" />
              </button>
            </div>
          </div>
        ) : message.imageStatus === 'loading' ? (
          // Đang loading image
          <div className="flex flex-col items-center justify-center text-center text-gray-400 p-4">
            <Spinner className="mb-4 h-8 w-8" />
            <p className="font-semibold">Đang tạo ảnh từ prompt:</p>
            <p className="text-sm italic mt-1">"{message.imagePrompt || message.optimizedPrompt}"</p>
          </div>
        ) : message.imageStatus === 'error' ? (
          // Error khi tạo ảnh
          <div className="flex flex-col items-center justify-center text-center text-red-400 p-4">
            <p className="font-semibold">Tạo ảnh thất bại</p>
            <p className="text-sm mt-1">Đã có lỗi xảy ra với prompt:</p>
            <p className="text-sm italic mt-1">"{message.imagePrompt || message.optimizedPrompt}"</p>
            <button 
              onClick={handleRegenerate}
              className="mt-4 flex items-center justify-center px-4 py-2 bg-red-600/50 hover:bg-red-500/50 text-red-100 font-semibold rounded-lg border border-red-500 transition-colors duration-300"
            >
              <RefreshIcon className="h-5 w-5 mr-2" />
              Thử lại
            </button>
          </div>
        ) : message.isOptimizing || message.optimizedPrompt ? (
          // Hiển thị Optimizing Prompt nếu chưa có image results
          <div className="space-y-4">
            {message.originalPrompt && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Prompt gốc:</p>
                <p className="italic">"{message.originalPrompt}"</p>
              </div>
            )}
            {message.explanation && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Giải thích:</p>
                <p>{message.explanation}</p>
              </div>
            )}
            {message.optimizedPrompt && (
              <div>
                <p className="font-semibold text-yellow-300 mb-2">Prompt đã tối ưu:</p>
                <div className="bg-gray-800/70 p-3 rounded-md border-2 border-yellow-400 shadow-inner">
                  <p className="font-bold">{message.optimizedPrompt}</p>
                </div>
              </div>
            )}
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
            {message.isOptimizing && (
              <div className="flex space-x-3 pt-3">
                <button
                  onClick={handleConfirm}
                  className="flex items-center justify-center px-4 py-2 bg-gradient-to-br from-purple-600 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <ConfirmIcon className="h-5 w-5 mr-2" />
                  Xác nhận & Tạo ảnh
                </button>
              </div>
            )}
            {/* Feedback buttons cho optimizing prompt */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-600/50">
              <button
                onClick={handleLike}
                disabled={isUpdatingFeedback || !sessionId}
                className={`flex items-center justify-center px-2 py-1 rounded text-xs transition-colors ${
                  feedback === 'like'
                    ? 'text-green-400 bg-green-400/20'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
                } ${isUpdatingFeedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={feedback === 'like' ? 'Gỡ like' : 'Hữu ích'}
              >
                <LikeIcon className="text-base leading-none" filled={feedback === 'like'} />
              </button>
              <button
                onClick={handleDislike}
                disabled={isUpdatingFeedback || !sessionId}
                className={`flex items-center justify-center px-2 py-1 rounded text-xs transition-colors ${
                  feedback === 'dislike'
                    ? 'text-red-400 bg-red-400/20'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
                } ${isUpdatingFeedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={feedback === 'dislike' ? 'Gỡ dislike' : 'Không hữu ích'}
              >
                <DislikeIcon className="text-base leading-none" filled={feedback === 'dislike'} />
              </button>
              <button
                onClick={handleReport}
                disabled={isReported || !sessionId}
                className={`flex items-center justify-center px-2 py-1 rounded text-xs transition-colors ${
                  isReported 
                    ? 'text-gray-500 cursor-not-allowed opacity-50' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
                }`}
                title={isReported ? 'Đã báo cáo' : 'Báo cáo tin nhắn'}
              >
                <ReportIcon className="text-base leading-none" />
              </button>
            </div>
          </div>
        ) : (
          // Text message thông thường
          <>
            <p>{message.text}</p>
            {/* Feedback buttons cho text message */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-600/50">
              <button
                onClick={handleLike}
                disabled={isUpdatingFeedback || !sessionId}
                className={`flex items-center justify-center px-2 py-1 rounded text-xs transition-colors ${
                  feedback === 'like'
                    ? 'text-green-400 bg-green-400/20'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
                } ${isUpdatingFeedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={feedback === 'like' ? 'Gỡ like' : 'Hữu ích'}
              >
                <LikeIcon className="text-base leading-none" filled={feedback === 'like'} />
              </button>
              <button
                onClick={handleDislike}
                disabled={isUpdatingFeedback || !sessionId}
                className={`flex items-center justify-center px-2 py-1 rounded text-xs transition-colors ${
                  feedback === 'dislike'
                    ? 'text-red-400 bg-red-400/20'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
                } ${isUpdatingFeedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={feedback === 'dislike' ? 'Gỡ dislike' : 'Không hữu ích'}
              >
                <DislikeIcon className="text-base leading-none" filled={feedback === 'dislike'} />
              </button>
              <button
                onClick={handleReport}
                disabled={isReported || !sessionId}
                className={`flex items-center justify-center px-2 py-1 rounded text-xs transition-colors ${
                  isReported 
                    ? 'text-gray-500 cursor-not-allowed opacity-50' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600/50'
                }`}
                title={isReported ? 'Đã báo cáo' : 'Báo cáo tin nhắn'}
              >
                <ReportIcon className="text-base leading-none" />
              </button>
            </div>
          </>
        )}
        
        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Báo cáo tin nhắn</h3>
              <p className="text-gray-300 text-sm mb-4">
                Bạn có chắc chắn muốn báo cáo tin nhắn này? Chúng tôi sẽ xem xét và xử lý.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmReport}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Báo cáo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;