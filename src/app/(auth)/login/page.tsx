'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [accessKey, setAccessKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccessKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/access-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: accessKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '잘못된 액세스 키입니다.');
        return;
      }

      // JWT 토큰 저장
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('postId', data.postId);

      // 해당 게시글로 이동
      router.push(`/post/${data.postId}`);
    } catch (err) {
      setError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '로그인에 실패했습니다.');
        return;
      }

      // JWT 토큰 저장
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);

      // 메인 페이지로 이동
      router.push('/');
    } catch (err) {
      setError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽: 액세스 키 입력 */}
      <div className="w-1/2 bg-blue-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white border-2 border-blue-400 rounded-lg p-8 mt-6">
            <form onSubmit={handleAccessKeyLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  액세스 키 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="액세스 키를 입력하세요"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !accessKey}
                className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? '처리중...' : '로그인'}
              </button>
            </form>
            <div className="mt-6 space-y-2">
              <p className="text-sm text-gray-600 flex items-start">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full text-xs mr-2 mt-0.5">i</span>
                제공된 액세스 키로 특정 게시물에 접근할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽: 관리자 로그인 */}
      <div className="w-1/2 bg-green-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white border-2 border-green-400 rounded-lg p-8 mt-6">
            <form onSubmit={handleAdminLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  아이디 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded bg-blue-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="관리자 아이디"
                  disabled={loading}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded bg-blue-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••••"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? '처리중...' : '로그인'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
