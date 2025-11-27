import React, { useState, useEffect } from 'react';
import { getMe, changePassword, deleteAccount } from '../services/authService';
import { getTransactions } from '../services/paymentService';
import type { CurrentUser } from '../types';
import type { Transaction } from '../services/paymentService';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: CurrentUser | null;
    onUserUpdate: (user: CurrentUser) => void;
    onLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, currentUser, onUserUpdate, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'transactions' | 'settings'>('info');
    const [userInfo, setUserInfo] = useState<CurrentUser | null>(currentUser);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Password change form
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Delete account form
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser) {
            setUserInfo(currentUser);
            loadTransactions();
        }
    }, [isOpen, currentUser]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const data = await getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error('Error loading transactions:', error);
            setError('Không thể tải lịch sử giao dịch');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setLoading(true);
            await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            setSuccess('Đổi mật khẩu thành công');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setSuccess(null), 3000);
        } catch (error: any) {
            setError(error.response?.data?.error || 'Đổi mật khẩu thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setError('Vui lòng nhập mật khẩu để xác nhận');
            return;
        }

        try {
            setLoading(true);
            await deleteAccount(deletePassword);
            setShowDeleteConfirm(false);
            onLogout();
        } catch (error: any) {
            setError(error.response?.data?.error || 'Xóa tài khoản thất bại');
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-400 bg-green-400/20';
            case 'pending':
                return 'text-yellow-400 bg-yellow-400/20';
            case 'failed':
                return 'text-red-400 bg-red-400/20';
            case 'cancelled':
                return 'text-gray-400 bg-gray-400/20';
            default:
                return 'text-gray-400 bg-gray-400/20';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Thành công';
            case 'pending':
                return 'Đang xử lý';
            case 'failed':
                return 'Thất bại';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-700/50"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent font-poppins">
                        Tài khoản cá nhân
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700/50 px-6">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-6 py-3 font-semibold transition-colors relative ${
                            activeTab === 'info'
                                ? 'text-indigo-400'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Thông tin
                        {activeTab === 'info' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-6 py-3 font-semibold transition-colors relative ${
                            activeTab === 'transactions'
                                ? 'text-indigo-400'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Lịch sử mua Credit
                        {activeTab === 'transactions' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-3 font-semibold transition-colors relative ${
                            activeTab === 'settings'
                                ? 'text-indigo-400'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        Cài đặt
                        {activeTab === 'settings' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"></div>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
                            {success}
                        </div>
                    )}

                    {/* Tab: Thông tin cơ bản */}
                    {activeTab === 'info' && userInfo && (
                        <div className="space-y-6">
                            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                                <h3 className="text-xl font-bold mb-4 font-poppins">Thông tin tài khoản</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Email</label>
                                        <p className="text-white font-medium">{userInfo.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Credit hiện tại</label>
                                        <p className="text-white font-medium text-2xl text-indigo-400">{userInfo.credits}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1 block">Ngày tham gia</label>
                                        <p className="text-white font-medium">
                                            {userInfo.createdAt ? formatDate(userInfo.createdAt) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Lịch sử mua Credit */}
                    {activeTab === 'transactions' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold mb-4 font-poppins">Lịch sử giao dịch</h3>
                            {loading ? (
                                <div className="text-center py-8 text-gray-400">Đang tải...</div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <p>Chưa có giao dịch nào</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((transaction) => (
                                        <div
                                            key={transaction._id}
                                            className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:border-indigo-500/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                                                        {getStatusText(transaction.status)}
                                                    </span>
                                                    <span className="text-sm text-gray-400">
                                                        {formatDate(transaction.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1 block">Số tiền</label>
                                                    <p className="text-white font-semibold">{formatCurrency(transaction.amount)}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1 block">Credit</label>
                                                    <p className="text-indigo-400 font-semibold">{transaction.credits}</p>
                                                </div>
                                                {transaction.bonusCredits > 0 && (
                                                    <div>
                                                        <label className="text-xs text-gray-400 mb-1 block">Bonus</label>
                                                        <p className="text-green-400 font-semibold">+{transaction.bonusCredits}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1 block">Mã đơn</label>
                                                    <p className="text-gray-300 text-xs font-mono">{transaction.invoiceNumber}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Cài đặt */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            {/* Đổi mật khẩu */}
                            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                                <h3 className="text-xl font-bold mb-4 font-poppins">Đổi mật khẩu</h3>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-400 mb-2 block">Mật khẩu hiện tại</label>
                                        <input
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-2 block">Mật khẩu mới</label>
                                        <input
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-2 block">Xác nhận mật khẩu mới</label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                    </button>
                                </form>
                            </div>

                            {/* Xóa tài khoản */}
                            <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/50">
                                <h3 className="text-xl font-bold mb-2 text-red-400 font-poppins">Xóa tài khoản</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.
                                </p>
                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                                    >
                                        Xóa tài khoản
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm text-gray-400 mb-2 block">Nhập mật khẩu để xác nhận</label>
                                            <input
                                                type="password"
                                                value={deletePassword}
                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-800 border border-red-500/50 rounded-lg text-white focus:outline-none focus:border-red-500"
                                                placeholder="Nhập mật khẩu của bạn"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={loading || !deletePassword}
                                                className="flex-1 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Đang xóa...' : 'Xác nhận xóa'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowDeleteConfirm(false);
                                                    setDeletePassword('');
                                                }}
                                                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;



