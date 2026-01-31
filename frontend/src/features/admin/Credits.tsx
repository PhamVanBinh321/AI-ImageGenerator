import React, { useState, useEffect } from 'react';
import { getCreditStats, addCredits, subtractCredits, bulkCreditOperation } from '../../api/adminApi';
import Spinner from '../../components/common/Spinner';

const Credits: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubtractModal, setShowSubtractModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [creditForm, setCreditForm] = useState({ userId: '', amount: 0 });
  const [bulkForm, setBulkForm] = useState({ userIds: '', operation: 'add' as 'add' | 'subtract', amount: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getCreditStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching credit stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!creditForm.userId || creditForm.amount <= 0) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    try {
      await addCredits(creditForm.userId, creditForm.amount);
      setShowAddModal(false);
      setCreditForm({ userId: '', amount: 0 });
      fetchStats();
      alert('Đã cộng credits thành công');
    } catch (error) {
      console.error('Error adding credits:', error);
      alert('Không thể cộng credits');
    }
  };

  const handleSubtractCredits = async () => {
    if (!creditForm.userId || creditForm.amount <= 0) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    try {
      await subtractCredits(creditForm.userId, creditForm.amount);
      setShowSubtractModal(false);
      setCreditForm({ userId: '', amount: 0 });
      fetchStats();
      alert('Đã trừ credits thành công');
    } catch (error) {
      console.error('Error subtracting credits:', error);
      alert('Không thể trừ credits');
    }
  };

  const handleBulkOperation = async () => {
    const userIds = bulkForm.userIds.split(',').map(id => id.trim()).filter(id => id);
    if (userIds.length === 0 || bulkForm.amount <= 0) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    try {
      await bulkCreditOperation({
        userIds,
        operation: bulkForm.operation,
        credits: bulkForm.amount
      });
      setShowBulkModal(false);
      setBulkForm({ userIds: '', operation: 'add', amount: 0 });
      fetchStats();
      alert(`Đã ${bulkForm.operation === 'add' ? 'cộng' : 'trừ'} credits cho ${userIds.length} users thành công`);
    } catch (error) {
      console.error('Error bulk credit operation:', error);
      alert('Không thể thực hiện thao tác');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Credit Management</h2>
          <p className="text-gray-400">Quản lý credits trong hệ thống</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            + Add Credits
          </button>
          <button
            onClick={() => setShowSubtractModal(true)}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
          >
            - Subtract Credits
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Bulk Operation
          </button>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Total Issued</div>
            <div className="text-3xl font-bold text-white">{formatNumber(stats.totalIssued)}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Total Used</div>
            <div className="text-3xl font-bold text-red-400">{formatNumber(stats.totalUsed)}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Remaining</div>
            <div className="text-3xl font-bold text-green-400">{formatNumber(stats.remaining)}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Current Credits</div>
            <div className="text-3xl font-bold text-blue-400">{formatNumber(stats.currentCredits)}</div>
          </div>
        </div>
      ) : null}

      {/* Top Users */}
      {stats?.topUsers && stats.topUsers.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Top Users by Credits</h3>
          <div className="space-y-2">
            {stats.topUsers.map((user: any, idx: number) => (
              <div key={user._id} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                <div>
                  <span className="text-gray-400 mr-2">#{idx + 1}</span>
                  <span className="text-white">{user.email}</span>
                </div>
                <span className="text-blue-400 font-semibold">{formatNumber(user.credits)} credits</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Add Credits</h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">User ID</label>
                <input
                  type="text"
                  value={creditForm.userId}
                  onChange={(e) => setCreditForm({ ...creditForm, userId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="User ID"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Amount</label>
                <input
                  type="number"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Credits amount"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCredits}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setCreditForm({ userId: '', amount: 0 });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtract Credits Modal */}
      {showSubtractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Subtract Credits</h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">User ID</label>
                <input
                  type="text"
                  value={creditForm.userId}
                  onChange={(e) => setCreditForm({ ...creditForm, userId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="User ID"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Amount</label>
                <input
                  type="number"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Credits amount"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubtractCredits}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
                >
                  Subtract
                </button>
                <button
                  onClick={() => {
                    setShowSubtractModal(false);
                    setCreditForm({ userId: '', amount: 0 });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Operation Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Bulk Credit Operation</h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">User IDs (comma separated)</label>
                <textarea
                  value={bulkForm.userIds}
                  onChange={(e) => setBulkForm({ ...bulkForm, userIds: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="user1, user2, user3..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Operation</label>
                <select
                  value={bulkForm.operation}
                  onChange={(e) => setBulkForm({ ...bulkForm, operation: e.target.value as 'add' | 'subtract' })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Amount</label>
                <input
                  type="number"
                  value={bulkForm.amount}
                  onChange={(e) => setBulkForm({ ...bulkForm, amount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Credits amount"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkOperation}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Execute
                </button>
                <button
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkForm({ userIds: '', operation: 'add', amount: 0 });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Credits;





