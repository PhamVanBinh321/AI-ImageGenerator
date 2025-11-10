import React from 'react';
import type { ChatSession } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
}) => {
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) {
      onDeleteChat(id);
    }
  };

  return (
    <div
      className={`absolute md:relative z-20 flex flex-col h-full bg-gray-900/70 backdrop-blur-xl border-r border-gray-700/50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 w-64`}
    >
      <div className="p-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between px-4 py-2 bg-gradient-to-br from-purple-600/50 to-blue-500/50 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          Trò chuyện mới
          <EditIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        <h2 className="px-4 text-sm font-semibold text-gray-400 mb-2">Lịch sử</h2>
        <nav className="flex flex-col space-y-1">
          {sessions.sort((a,b) => b.createdAt - a.createdAt).map((session) => (
            <a
              key={session.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectChat(session.id);
              }}
              className={`group flex justify-between items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeSessionId === session.id
                  ? 'bg-gray-700/80 text-white'
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <span className="truncate">{session.title}</span>
              <button
                onClick={(e) => handleDelete(e, session.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                aria-label="Delete chat"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;