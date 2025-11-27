import React from 'react';

interface AdminSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentPath, onNavigate }) => {
  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/sessions', label: 'Sessions', icon: '💬' },
    { path: '/admin/transactions', label: 'Transactions', icon: '💰' },
    { path: '/admin/feedback', label: 'Feedback', icon: '📝' },
    { path: '/admin/credits', label: 'Credits', icon: '⭐' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          Admin Panel
        </h2>
      </div>
      <nav className="px-4">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path || 
            (item.path !== '/admin' && currentPath.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;

