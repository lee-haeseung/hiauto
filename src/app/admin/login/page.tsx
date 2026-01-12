'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '@/lib/api/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiPost<{ token: string; role: string }>(
        '/api/auth/admin-login',
        { username, password }
      );

      console.log('로그인 성공:', data);

      // JWT 토큰 저장
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);

      console.log('localStorage 저장 완료:', {
        token: localStorage.getItem('token'),
        role: localStorage.getItem('role')
      });

      // 관리자 페이지로 이동
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-700">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">관리자 로그인</h1>
          <p className="text-slate-300">관리자 계정으로 로그인하세요</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <form onSubmit={handleAdminLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이디 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="관리자 아이디"
                disabled={loading}
                autoComplete="username"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="••••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-slate-700 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '처리중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-slate-500 mr-2 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-600">
                관리자 권한이 필요한 영역입니다.
              </p>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 bg-red-500 text-white px-4 py-3 rounded-lg text-center shadow-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
