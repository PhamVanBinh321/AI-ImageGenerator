import React from 'react';
import LogoutIcon from './icons/LogoutIcon';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentUser: { email: string; role: string };
  currentPath: string;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  currentUser, 
  currentPath,
  onLogout, 
  onNavigate 
}) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    window.location.href = '/';
  };

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    onNavigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <AdminSidebar currentPath={currentPath} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Admin Panel
              </h1>
              <p className="text-sm text-gray-400 mt-1">Quản trị hệ thống</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-300">{currentUser.email}</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                <LogoutIcon className="h-5 w-5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

