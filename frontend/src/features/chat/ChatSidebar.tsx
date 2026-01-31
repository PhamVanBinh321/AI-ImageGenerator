import React from 'react';
import EditIcon from '../../components/common/icons/EditIcon';
import TrashIcon from '../../components/common/icons/TrashIcon';
import UserIcon from '../../components/common/icons/UserIcon';
import LogoutIcon from '../../components/common/icons/LogoutIcon';
import CreditIcon from '../../components/common/icons/CreditIcon';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ChatSidebarProps {
    isOpen: boolean;
    onSearchClick: () => void;
    onBuyCredits: () => void;
    onProfileClick: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    isOpen,
    onSearchClick,
    onBuyCredits,
    onProfileClick,
}) => {
    const { sessions, activeSessionId, createNewChat, selectChat, deleteChat } = useChat();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) {
            deleteChat(id);
        }
    };

    return (
        <div
            className={`absolute md:relative z-20 flex flex-col h-full bg-gray-900/70 backdrop-blur-xl border-r border-gray-700/50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 w-64`}
        >
            <div className="p-2 space-y-2">
                <button
                    onClick={() => createNewChat()}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gradient-to-br from-purple-600/50 to-blue-500/50 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                    Trò chuyện mới
                    <EditIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={onSearchClick}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-800/50 text-gray-300 font-medium rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                    <span>Tìm kiếm đoạn chat</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </div>
            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
                <h2 className="px-4 text-sm font-semibold text-gray-400 mb-2">Lịch sử</h2>
                <nav className="flex flex-col space-y-1">
                    {sessions.map((session) => (
                        <a
                            key={session._id}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                selectChat(session._id);
                            }}
                            className={`group flex justify-between items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${activeSessionId === session._id
                                    ? 'bg-gray-700/80 text-white'
                                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                                }`}
                        >
                            <span className="truncate">{session.title}</span>
                            <button
                                onClick={(e) => handleDelete(e, session._id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                                aria-label="Delete chat"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </a>
                    ))}
                </nav>
            </div>
            <div className="p-2 mt-auto border-t border-gray-700/50">
                {user && (
                    <div className="flex flex-col space-y-2">
                        <div className="p-2 bg-gray-800/40 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                    <CreditIcon className="h-5 w-5 mr-2 text-yellow-400 flex-shrink-0" />
                                    <span className="text-sm text-gray-400 mr-2">Credits:</span>
                                    <span className="text-lg font-bold text-white">{user.credits}</span>
                                </div>
                            </div>
                            <button
                                onClick={onBuyCredits}
                                className="w-full flex items-center justify-center px-3 py-2 bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white text-sm font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                <svg
                                    className="h-4 w-4 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                </svg>
                                Mua Credit
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/40">
                            <button
                                onClick={onProfileClick}
                                className="flex items-center min-w-0 flex-1 hover:bg-gray-700/50 rounded-lg p-2 transition-colors"
                                aria-label="Tài khoản"
                            >
                                <UserIcon className="h-6 w-6 mr-3 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-300 truncate">{user.email}</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                aria-label="Đăng xuất"
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors ml-2"
                            >
                                <LogoutIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
