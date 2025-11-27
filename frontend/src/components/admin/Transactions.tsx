import React, { useState, useEffect } from 'react';
import { getTransactions, getTransactionDetails, updateTransaction } from '../../services/adminService';
import Spinner from '../Spinner';

interface Transaction {
  _id: string;
  invoiceNumber: string;
  orderId: string;
  packageId: string;
  amount: number;
  credits: number;
  bonusCredits: number;
  status: string;
  paymentMethod: string;
  user: { email: string };
  createdAt: string;
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', startDate: '', endDate: '', minAmount: '', maxAmount: '', packageId: '' });
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [transactionDetail, setTransactionDetail] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.minAmount) params.minAmount = parseFloat(filters.minAmount);
      if (filters.maxAmount) params.maxAmount = parseFloat(filters.maxAmount);
      if (filters.packageId) params.packageId = filters.packageId;

      const data = await getTransactions(params);
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const data = await getTransactionDetails(id);
      setTransactionDetail(data);
      setShowDetail(id);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!window.confirm(`Cập nhật status thành ${newStatus}?`)) return;
    try {
      await updateTransaction(id, { status: newStatus });
      fetchTransactions();
      if (showDetail === id) {
        const data = await getTransactionDetails(id);
        setTransactionDetail(data);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Không thể cập nhật transaction');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Transaction Management</h2>
        <p className="text-gray-400">Quản lý giao dịch thanh toán</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm invoice/order..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
          <button
            onClick={() => setFilters({ search: '', status: '', startDate: '', endDate: '', minAmount: '', maxAmount: '', packageId: '' })}
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
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Invoice</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">User</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Package</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Amount</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Credits</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Created At</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="border-t border-gray-700 hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-white">{tx.invoiceNumber}</td>
                      <td className="px-4 py-3 text-gray-400">{tx.user?.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-400">Package {tx.packageId}</td>
                      <td className="px-4 py-3 text-white">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {tx.credits}
                        {tx.bonusCredits > 0 && <span className="text-green-400"> +{tx.bonusCredits}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={getStatusColor(tx.status)}>{tx.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(tx.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetail(tx._id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                          >
                            View
                          </button>
                          {tx.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(tx._id, 'completed')}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                Không tìm thấy transactions nào
              </div>
            )}
            {/* Pagination */}
            <div className="px-4 py-3 bg-gray-700 flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                Trang {pagination.page} / {pagination.pages} ({pagination.total} transactions)
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

      {/* Transaction Detail Modal */}
      {showDetail && transactionDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-white">Transaction Details</h3>
              <button
                onClick={() => {
                  setShowDetail(null);
                  setTransactionDetail(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Invoice Number</label>
                  <p className="text-white">{transactionDetail.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Order ID</label>
                  <p className="text-white">{transactionDetail.orderId}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">User</label>
                  <p className="text-white">{transactionDetail.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Package</label>
                  <p className="text-white">Package {transactionDetail.packageId}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Amount</label>
                  <p className="text-white">{formatCurrency(transactionDetail.amount)}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Credits</label>
                  <p className="text-white">
                    {transactionDetail.credits}
                    {transactionDetail.bonusCredits > 0 && <span className="text-green-400"> +{transactionDetail.bonusCredits} bonus</span>}
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Status</label>
                  <p className={getStatusColor(transactionDetail.status)}>{transactionDetail.status}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Payment Method</label>
                  <p className="text-white">{transactionDetail.paymentMethod || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Created At</label>
                  <p className="text-white">{formatDate(transactionDetail.createdAt)}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Updated At</label>
                  <p className="text-white">{formatDate(transactionDetail.updatedAt)}</p>
                </div>
              </div>
              {transactionDetail.ipnData && (
                <div>
                  <label className="text-gray-400 text-sm">IPN Data</label>
                  <pre className="bg-gray-700 p-4 rounded text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(transactionDetail.ipnData, null, 2)}
                  </pre>
                </div>
              )}
              {transactionDetail.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleUpdateStatus(transactionDetail._id, 'completed')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Mark as Completed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(transactionDetail._id, 'failed')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    Mark as Failed
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;

