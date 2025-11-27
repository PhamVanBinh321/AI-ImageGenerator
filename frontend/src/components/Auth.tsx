import React, { useState, FormEvent } from 'react';

interface AuthProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onSignup: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setError('');
    setIsLoading(true);
    const handler = isLogin ? onLogin : onSignup;
    const result = await handler(email, password);
    if (!result.success) {
      setError(result.error || 'Đã có lỗi xảy ra.');
    }
    setIsLoading(false);
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          {isLogin ? 'Đăng nhập' : 'Đăng ký'}
        </h1>
        <p className="text-center text-gray-400 mb-8">
          {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản để lưu cuộc trò chuyện.'}
        </p>

        {error && (
          <div className="bg-red-500/30 border border-red-500 text-red-300 p-3 rounded-md mb-6 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-700/50 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow duration-300"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Mật khẩu</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-700/50 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow duration-300"
              placeholder="••••••••"
            />
            {!isLogin && (
              <div className="mt-2 text-xs text-gray-400 space-y-1">
                <p className="flex items-center">
                  <span className="mr-2">•</span>
                  Không được rỗng
                </p>
                <p className="flex items-center">
                  <span className="mr-2">•</span>
                  Tối thiểu 8 ký tự
                </p>
                <p className="flex items-center">
                  <span className="mr-2">•</span>
                  Có ít nhất 1 chữ hoa, 1 chữ thường, 1 số
                </p>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-br from-purple-600 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
          >
            {isLoading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;