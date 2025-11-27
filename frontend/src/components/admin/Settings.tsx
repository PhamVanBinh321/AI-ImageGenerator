import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../services/adminService';
import Spinner from '../Spinner';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-red-400">Không thể tải settings</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">System Settings</h2>
        <p className="text-gray-400">Cài đặt hệ thống</p>
      </div>

      {/* Credit Packages */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Credit Packages</h3>
        <div className="space-y-4">
          {settings.creditPackages.map((pkg: any, idx: number) => (
            <div key={idx} className="bg-gray-700 p-4 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">Package {pkg.id}</div>
                  <div className="text-gray-400 text-sm">
                    {pkg.credits} credits
                    {pkg.bonusCredits > 0 && <span className="text-green-400"> + {pkg.bonusCredits} bonus</span>}
                  </div>
                </div>
                <div className="text-white font-semibold">{formatCurrency(pkg.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Default Credits */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Default Credits</h3>
        <div className="text-white text-lg">{settings.defaultCredits} credits</div>
        <p className="text-gray-400 text-sm mt-2">Số credits mới user nhận được khi đăng ký</p>
      </div>

      {/* API Keys */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">API Keys</h3>
        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Gemini API Key</label>
            <div className="px-4 py-2 bg-gray-700 rounded text-white font-mono">
              {settings.apiKeys.gemini}
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">SePay API Key</label>
            <div className="px-4 py-2 bg-gray-700 rounded text-white font-mono">
              {settings.apiKeys.sepay}
            </div>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-2">API keys được mask để bảo mật</p>
      </div>

      {/* System Info */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">System Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Version</label>
            <div className="text-white">{settings.systemInfo.version}</div>
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Uptime</label>
            <div className="text-white">{formatUptime(settings.systemInfo.uptime)}</div>
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Node Version</label>
            <div className="text-white">{settings.systemInfo.nodeVersion}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

