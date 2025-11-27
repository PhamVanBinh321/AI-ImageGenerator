import React, { useState, useEffect } from 'react';
import { getUsers, getUserDetails, updateUser, deleteUser, bulkUserOperation, addCredits, subtractCredits } from '../../services/adminService';
import Spinner from '../Spinner';

interface User {
  _id: string;
  email: string;
  credits: number;
  sessionCount: number;
  transactionCount: number;
  totalSpent: number;
  createdAt: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ minCredits: '', maxCredits: '', startDate: '', endDate: '' });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserDetail, setShowUserDetail] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditOperation, setCreditOperation] = useState<{ userId: string; type: 'add' | 'subtract'; amount: number } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search) params.search = search;
      if (filters.minCredits) params.minCredits = parseInt(filters.minCredits);
      if (filters.maxCredits) params.maxCredits = parseInt(filters.maxCredits);
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data = await getUsers(params);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      const errorMessage = error?.message || 'Không thể tải danh sách users';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId: string) => {
    try {
      const data = await getUserDetails(userId);
      setUserDetail(data);
      setShowUserDetail(userId);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa user này?')) return;
    try {
      await deleteUser(userId);
      fetchUsers();
      if (selectedUsers.includes(userId)) {
        setSelectedUsers(selectedUsers.filter(id => id !== userId));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Không thể xóa user');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedUsers.length} users?`)) return;
    try {
      await bulkUserOperation({ userIds: selectedUsers, operation: 'delete' });
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      alert('Không thể xóa users');
    }
  };

  const handleBulkCreditOperation = async (operation: 'add' | 'subtract', credits: number) => {
    if (selectedUsers.length === 0) {
      alert('Vui lòng chọn ít nhất một user');
      return;
    }
    if (!window.confirm(`${operation === 'add' ? 'Cộng' : 'Trừ'} ${credits} credits cho ${selectedUsers.length} users?`)) return;
    try {
      await bulkUserOperation({ userIds: selectedUsers, operation, credits });
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk credit operation:', error);
      alert('Không thể thực hiện thao tác');
    }
  };

  const handleCreditOperation = async () => {
    if (!creditOperation || creditOperation.amount <= 0) {
      alert('Vui lòng nhập số credits hợp lệ');
      return;
    }
    try {
      if (creditOperation.type === 'add') {
        await addCredits(creditOperation.userId, creditOperation.amount);
      } else {
        await subtractCredits(creditOperation.userId, creditOperation.amount);
      }
      setShowCreditModal(false);
      setCreditOperation(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating credits:', error);
      alert('Không thể cập nhật credits');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">User Management</h2>
          <p className="text-gray-400">Quản lý users và credits</p>
        </div>
        {selectedUsers.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                const credits = prompt('Nhập số credits:');
                if (credits) handleBulkCreditOperation('add', parseInt(credits));
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              Cộng Credits
            </button>
            <button
              onClick={() => {
                const credits = prompt('Nhập số credits:');
                if (credits) handleBulkCreditOperation('subtract', parseInt(credits));
              }}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
            >
              Trừ Credits
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Xóa ({selectedUsers.length})
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
          />
          <input
            type="number"
            placeholder="Min credits"
            value={filters.minCredits}
            onChange={(e) => setFilters({ ...filters, minCredits: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
          />
          <input
            type="number"
            placeholder="Max credits"
            value={filters.maxCredits}
            onChange={(e) => setFilters({ ...filters, maxCredits: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
          />
          <button
            onClick={() => setFilters({ minCredits: '', maxCredits: '', startDate: '', endDate: '' })}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(users.map(u => u._id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Credits</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Sessions</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Transactions</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Total Spent</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Created At</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-t border-gray-700 hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user._id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-white">{user.email}</td>
                      <td className="px-4 py-3 text-white">{user.credits}</td>
                      <td className="px-4 py-3 text-gray-400">{user.sessionCount}</td>
                      <td className="px-4 py-3 text-gray-400">{user.transactionCount}</td>
                      <td className="px-4 py-3 text-gray-400">{formatCurrency(user.totalSpent)}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewUser(user._id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setCreditOperation({ userId: user._id, type: 'add', amount: 0 });
                              setShowCreditModal(true);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                          >
                            +Credits
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                Không tìm thấy users nào
              </div>
            )}
            {/* Pagination */}
            <div className="px-4 py-3 bg-gray-700 flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                Trang {pagination.page} / {pagination.pages} ({pagination.total} users)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserDetail && userDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-white">User Details</h3>
              <button
                onClick={() => {
                  setShowUserDetail(null);
                  setUserDetail(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Email</label>
                <p className="text-white">{userDetail.user.email}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Credits</label>
                <p className="text-white">{userDetail.user.credits}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Created At</label>
                <p className="text-white">{formatDate(userDetail.user.createdAt)}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Recent Sessions ({userDetail.recentSessions.length})</label>
                <div className="mt-2 space-y-2">
                  {userDetail.recentSessions.map((session: any) => (
                    <div key={session._id} className="bg-gray-700 p-3 rounded">
                      <p className="text-white">{session.title}</p>
                      <p className="text-gray-400 text-sm">{formatDate(session.updatedAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Recent Transactions ({userDetail.recentTransactions.length})</label>
                <div className="mt-2 space-y-2">
                  {userDetail.recentTransactions.map((tx: any) => (
                    <div key={tx._id} className="bg-gray-700 p-3 rounded">
                      <p className="text-white">{tx.invoiceNumber}</p>
                      <p className="text-gray-400 text-sm">{formatCurrency(tx.amount)} - {tx.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Operation Modal */}
      {showCreditModal && creditOperation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              {creditOperation.type === 'add' ? 'Cộng' : 'Trừ'} Credits
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Số lượng credits</label>
                <input
                  type="number"
                  value={creditOperation.amount}
                  onChange={(e) => setCreditOperation({ ...creditOperation, amount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreditOperation}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => {
                    setShowCreditModal(false);
                    setCreditOperation(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

