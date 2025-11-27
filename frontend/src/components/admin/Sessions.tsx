import React, { useState, useEffect } from 'react';
import { getSessions, getSessionDetails, deleteSession } from '../../services/adminService';
import Spinner from '../Spinner';

interface Session {
  _id: string;
  title: string;
  user: { email: string };
  messagesCount: number;
  hasImages: boolean;
  createdAt: string;
  updatedAt: string;
}

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ search: '', userId: '', startDate: '', endDate: '', hasImages: '' });
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<any>(null);

  useEffect(() => {
    fetchSessions();
  }, [pagination.page, filters]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.search) params.search = filters.search;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.hasImages === 'true') params.hasImages = true;

      const data = await getSessions(params);
      setSessions(data.sessions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const data = await getSessionDetails(id);
      setSessionDetail(data);
      setShowDetail(id);
    } catch (error) {
      console.error('Error fetching session details:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa session này?')) return;
    try {
      await deleteSession(id);
      fetchSessions();
      if (showDetail === id) {
        setShowDetail(null);
        setSessionDetail(null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Không thể xóa session');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Session Management</h2>
        <p className="text-gray-400">Quản lý chat sessions</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm title..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
          />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
          <select
            value={filters.hasImages}
            onChange={(e) => setFilters({ ...filters, hasImages: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="">All Sessions</option>
            <option value="true">Has Images</option>
            <option value="false">No Images</option>
          </select>
          <button
            onClick={() => setFilters({ search: '', userId: '', startDate: '', endDate: '', hasImages: '' })}
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
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Title</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">User</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Messages</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Has Images</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Created At</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Updated At</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session._id} className="border-t border-gray-700 hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-white">{session.title}</td>
                      <td className="px-4 py-3 text-gray-400">{session.user?.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-400">{session.messagesCount}</td>
                      <td className="px-4 py-3">
                        {session.hasImages ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-gray-500">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(session.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(session.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetail(session._id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(session._id)}
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
            {sessions.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                Không tìm thấy sessions nào
              </div>
            )}
            {/* Pagination */}
            <div className="px-4 py-3 bg-gray-700 flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                Trang {pagination.page} / {pagination.pages} ({pagination.total} sessions)
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

      {/* Session Detail Modal */}
      {showDetail && sessionDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-white">Session Details</h3>
              <button
                onClick={() => {
                  setShowDetail(null);
                  setSessionDetail(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Title</label>
                  <p className="text-white">{sessionDetail.title}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">User</label>
                  <p className="text-white">{sessionDetail.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Created At</label>
                  <p className="text-white">{formatDate(sessionDetail.createdAt)}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Updated At</label>
                  <p className="text-white">{formatDate(sessionDetail.updatedAt)}</p>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Messages ({sessionDetail.messages.length})</label>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sessionDetail.messages.map((msg: any, idx: number) => (
                    <div key={idx} className="bg-gray-700 p-4 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-purple-600'} text-white`}>
                          {msg.sender === 'user' ? 'User' : 'AI'}
                        </span>
                        {msg.feedback?.type && (
                          <span className={`px-2 py-1 rounded text-xs ${msg.feedback.type === 'like' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                            {msg.feedback.type === 'like' ? '👍' : '👎'}
                          </span>
                        )}
                        {msg.feedback?.reported && (
                          <span className="px-2 py-1 rounded text-xs bg-orange-600 text-white">⚠️ Reported</span>
                        )}
                      </div>
                      {msg.text && <p className="text-white mb-2">{msg.text}</p>}
                      {msg.originalPrompt && (
                        <div className="mb-2">
                          <p className="text-gray-400 text-sm">Original Prompt:</p>
                          <p className="text-white">{msg.originalPrompt}</p>
                        </div>
                      )}
                      {msg.optimizedPrompt && (
                        <div className="mb-2">
                          <p className="text-gray-400 text-sm">Optimized Prompt:</p>
                          <p className="text-white">{msg.optimizedPrompt}</p>
                        </div>
                      )}
                      {msg.explanation && (
                        <div className="mb-2">
                          <p className="text-gray-400 text-sm">Explanation:</p>
                          <p className="text-white">{msg.explanation}</p>
                        </div>
                      )}
                      {msg.imageUrls && msg.imageUrls.length > 0 && (
                        <div className="mt-2">
                          <p className="text-gray-400 text-sm mb-2">Images ({msg.imageUrls.length}):</p>
                          <div className="grid grid-cols-2 gap-2">
                            {msg.imageUrls.map((url: string, imgIdx: number) => (
                              <img key={imgIdx} src={url} alt={`Generated ${imgIdx + 1}`} className="rounded max-w-full" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;

