import React, { useState, useEffect } from 'react';
import { getDashboardStats, getDashboardCharts } from '../../services/adminService';
import Spinner from '../Spinner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    newWeek: number;
    newMonth: number;
  };
  sessions: {
    total: number;
    newToday: number;
    newWeek: number;
    newMonth: number;
  };
  transactions: {
    total: number;
    byStatus: {
      pending: number;
      completed: number;
      failed: number;
      cancelled: number;
    };
  };
  revenue: {
    total: number;
  };
  credits: {
    issued: number;
    used: number;
    remaining: number;
  };
  feedback: {
    like: number;
    dislike: number;
    report: number;
  };
}

interface ChartData {
  revenue: Array<{ _id: string; revenue: number }>;
  users: Array<{ _id: string; count: number }>;
  transactionsByStatus: Array<{ _id: string; count: number }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        alert('Không thể tải dữ liệu dashboard. Vui lòng kiểm tra console để xem chi tiết lỗi.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const data = await getDashboardCharts(period);
        setChartData(data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setChartLoading(false);
      }
    };
    fetchCharts();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-red-400">Không thể tải dữ liệu dashboard</div>;
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const formatCurrencyShort = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Prepare chart data
  const revenueChartData = chartData?.revenue.map(item => ({
    date: new Date(item._id).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    revenue: item.revenue
  })) || [];

  const usersChartData = chartData?.users.map(item => ({
    date: new Date(item._id).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    users: item.count
  })) || [];

  const transactionStatusData = chartData?.transactionsByStatus.map(item => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count
  })) || [];

  const COLORS = {
    completed: '#10b981',
    pending: '#f59e0b',
    failed: '#ef4444',
    cancelled: '#6b7280'
  };

  const getStatusColor = (name: string) => {
    const lowerName = name.toLowerCase();
    return COLORS[lowerName as keyof typeof COLORS] || '#6b7280';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">Tổng quan hệ thống</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Tổng Users</h3>
            <span className="text-2xl">👥</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{formatNumber(stats.users.total)}</div>
          <div className="text-sm text-gray-400">
            <div>Hôm nay: +{stats.users.newToday}</div>
            <div>Tuần này: +{stats.users.newWeek}</div>
            <div>Tháng này: +{stats.users.newMonth}</div>
          </div>
        </div>

        {/* Sessions Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Tổng Sessions</h3>
            <span className="text-2xl">💬</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{formatNumber(stats.sessions.total)}</div>
          <div className="text-sm text-gray-400">
            <div>Hôm nay: +{stats.sessions.newToday}</div>
            <div>Tuần này: +{stats.sessions.newWeek}</div>
            <div>Tháng này: +{stats.sessions.newMonth}</div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Tổng Doanh Thu</h3>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.revenue.total)}</div>
          <div className="text-sm text-gray-400">
            <div>Từ {formatNumber(stats.transactions.byStatus.completed)} giao dịch</div>
          </div>
        </div>

        {/* Credits Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Credits</h3>
            <span className="text-2xl">⭐</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{formatNumber(stats.credits.issued)}</div>
          <div className="text-sm text-gray-400">
            <div>Đã phát hành: {formatNumber(stats.credits.issued)}</div>
            <div>Đã sử dụng: {formatNumber(stats.credits.used)}</div>
            <div>Còn lại: {formatNumber(stats.credits.remaining)}</div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Transactions Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Giao Dịch</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Tổng:</span>
              <span className="text-white font-medium">{formatNumber(stats.transactions.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Completed:</span>
              <span className="text-green-400 font-medium">{formatNumber(stats.transactions.byStatus.completed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pending:</span>
              <span className="text-yellow-400 font-medium">{formatNumber(stats.transactions.byStatus.pending)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Failed:</span>
              <span className="text-red-400 font-medium">{formatNumber(stats.transactions.byStatus.failed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cancelled:</span>
              <span className="text-gray-400 font-medium">{formatNumber(stats.transactions.byStatus.cancelled)}</span>
            </div>
          </div>
        </div>

        {/* Feedback Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Feedback</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Likes:</span>
              <span className="text-green-400 font-medium">{formatNumber(stats.feedback.like)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Dislikes:</span>
              <span className="text-red-400 font-medium">{formatNumber(stats.feedback.dislike)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Reports:</span>
              <span className="text-orange-400 font-medium">{formatNumber(stats.feedback.report)}</span>
            </div>
            {stats.feedback.like + stats.feedback.dislike > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">Like Ratio:</span>
                  <span className="text-white font-medium">
                    {((stats.feedback.like / (stats.feedback.like + stats.feedback.dislike)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Biểu đồ thống kê</h3>
          <select
            value={period}
            onChange={(e) => {
              setPeriod(parseInt(e.target.value));
              setChartLoading(true);
            }}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={90}>90 ngày</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Doanh thu theo thời gian</h4>
            {chartLoading ? (
              <div className="flex items-center justify-center h-64">
                <Spinner />
              </div>
            ) : revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => formatCurrencyShort(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Doanh thu (VND)"
                    dot={{ fill: '#8b5cf6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                Không có dữ liệu
              </div>
            )}
          </div>

          {/* New Users Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Users mới theo thời gian</h4>
            {chartLoading ? (
              <div className="flex items-center justify-center h-64">
                <Spinner />
              </div>
            ) : usersChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usersChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="users" 
                    fill="#3b82f6"
                    name="Số users mới"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                Không có dữ liệu
              </div>
            )}
          </div>
        </div>

        {/* Transaction Status Pie Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">Giao dịch theo trạng thái</h4>
          {chartLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner />
            </div>
          ) : transactionStatusData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={transactionStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {transactionStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

