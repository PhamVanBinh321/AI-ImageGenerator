import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import LandingPage from '../pages/LandingPage';
import AdminLayout from '../layouts/AdminLayout';
import AdminLogin from '../features/auth/AdminLogin';
import Spinner from '../components/common/Spinner';

// Admin Components
import Dashboard from '../features/admin/Dashboard';
import Users from '../features/admin/Users';
import Sessions from '../features/admin/Sessions';
import Transactions from '../features/admin/Transactions';
import Feedback from '../features/admin/Feedback';
import Settings from '../features/admin/Settings';
import Credits from '../features/admin/Credits';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
    if (!isAuthenticated) return <Navigate to="/login" />;
    return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
    if (!isAuthenticated) return <Navigate to="/admin/login" />;
    if (user?.role !== 'admin') return <Navigate to="/" />;
    return <>{children}</>;
}

const AppRoutes: React.FC = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<LoginPage />} />

            {/* Public Landing Page */}
            <Route path="/" element={
                isAuthenticated ? <Navigate to="/chat" /> : <LandingPage />
            } />

            {/* Protected App Routes */}
            <Route path="/chat" element={
                <ProtectedRoute>
                    <HomePage />
                </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={
                <AdminRoute>
                    <AdminLayout>
                        <Routes>
                            <Route index element={<Dashboard />} />
                            <Route path="users" element={<Users />} />
                            <Route path="sessions" element={<Sessions />} />
                            <Route path="transactions" element={<Transactions />} />
                            <Route path="feedback" element={<Feedback />} />
                            <Route path="credits" element={<Credits />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="*" element={<Navigate to="/admin" />} />
                        </Routes>
                    </AdminLayout>
                </AdminRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRoutes;
