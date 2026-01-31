import React, { useState, useEffect } from 'react';
import { getReports, dismissReport, getFeedbackStats } from '../../api/adminApi';
import Spinner from '../../components/common/Spinner';

interface Report {
  messageId: string;
  sessionId: string;
  sessionTitle: string;
  userEmail: string;
  messagePreview: string;
  reportedAt: string;
}

const Feedback: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data = await getReports(params);
      setReports(data.reports);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getFeedbackStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
    }
  };

  const handleDismissReport = async (messageId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn bỏ qua report này?')) return;
    try {
      await dismissReport(messageId);
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Error dismissing report:', error);
      alert('Không thể bỏ qua report');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Feedback & Reports</h2>
        <p className="text-gray-400">Quản lý feedback và reported messages</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Likes</div>
            <div className="text-3xl font-bold text-green-400">{stats.like}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Dislikes</div>
            <div className="text-3xl font-bold text-red-400">{stats.dislike}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Reports</div>
            <div className="text-3xl font-bold text-orange-400">{stats.report}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Like Ratio</div>
            <div className="text-3xl font-bold text-white">{stats.likeDislikeRatio}%</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
          <button
            onClick={() => setFilters({ startDate: '', endDate: '' })}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white">Reported Messages</h3>
        </div>
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
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">User</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Session</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Message Preview</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Reported At</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.messageId} className="border-t border-gray-700 hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-white">{report.userEmail}</td>
                      <td className="px-4 py-3 text-gray-400">{report.sessionTitle}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-md truncate">{report.messagePreview}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(report.reportedAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDismissReport(report.messageId)}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                        >
                          Dismiss
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reports.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                Không có reports nào
              </div>
            )}
            {/* Pagination */}
            <div className="px-4 py-3 bg-gray-700 flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                Trang {pagination.page} / {pagination.pages} ({pagination.total} reports)
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
    </div>
  );
};

export default Feedback;

