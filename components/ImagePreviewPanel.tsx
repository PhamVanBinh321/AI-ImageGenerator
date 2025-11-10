
import React from 'react';
import type { ImageState } from '../types';
import Spinner from './Spinner';
import AIIcon from './icons/AIIcon';
import DownloadIcon from './icons/DownloadIcon';
import RefreshIcon from './icons/RefreshIcon';

interface ImagePreviewPanelProps {
  imageState: ImageState;
  onRetry: () => void;
}

const ImagePreviewPanel: React.FC<ImagePreviewPanelProps> = ({ imageState, onRetry }) => {
    const handleDownload = (url: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderContent = () => {
        switch (imageState.status) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center text-center text-gray-400">
                        <Spinner className="mb-4" />
                        <p className="text-lg font-semibold">Đang tạo ảnh...</p>
                        <p className="text-sm">Vui lòng đợi trong giây lát.</p>
                    </div>
                );
            case 'success':
                if (!imageState.urls || imageState.urls.length === 0) {
                     return <div className="text-center text-red-400">Không có ảnh nào được tạo.</div>
                }
                return (
                    <div className="w-full h-full flex flex-col">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min overflow-y-auto">
                            {imageState.urls.map((url, index) => (
                                <div key={index} className="relative group w-full aspect-square">
                                    <img 
                                        src={url} 
                                        alt={`AI generated image ${index + 1}`} 
                                        className="w-full h-full object-contain rounded-lg shadow-lg" 
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-lg">
                                        <button onClick={() => handleDownload(url)} className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-md text-white font-semibold rounded-lg hover:bg-white/30 transition-colors">
                                            <DownloadIcon className="h-5 w-5 mr-2" />
                                            Tải xuống
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Prompt đã sử dụng:</p>
                            <p className="text-sm text-gray-200 italic line-clamp-2">"{imageState.prompt}"</p>
                        </div>
                        <button onClick={onRetry} className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-gray-600/50 hover:bg-gray-500/50 text-gray-200 font-semibold rounded-lg border border-gray-500 transition-colors duration-300">
                            <RefreshIcon className="h-5 w-5 mr-2" />
                            Thay đổi prompt
                        </button>
                    </div>
                );
            case 'error':
                 return (
                    <div className="flex flex-col items-center justify-center text-center text-red-400">
                        <p className="text-lg font-semibold">Tạo ảnh thất bại</p>
                        <p className="text-sm mt-2">Đã có lỗi xảy ra. Vui lòng thử lại.</p>
                         <button onClick={onRetry} className="mt-6 w-full flex items-center justify-center px-4 py-2 bg-red-600/50 hover:bg-red-500/50 text-red-100 font-semibold rounded-lg border border-red-500 transition-colors duration-300">
                            <RefreshIcon className="h-5 w-5 mr-2" />
                            Thử lại
                        </button>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div className="flex flex-col items-center justify-center text-center text-gray-500">
                        <AIIcon className="h-24 w-24 mb-4 text-gray-600" />
                        <p className="text-lg font-semibold">Vùng xem trước ảnh</p>
                        <p className="text-sm">Ảnh sẽ xuất hiện sau khi bạn xác nhận prompt.</p>
                    </div>
                );
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-800/30 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6 shadow-2xl overflow-hidden">
            {renderContent()}
        </div>
    );
};

export default ImagePreviewPanel;
