'use client';

import AdminLayout from '@/components/AdminLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AccessKey {
  id: number;
  key: string;
  postId: number;
  memo: string | null;
  expiresAt: string | null;
  createdAt: string;
  postTitle?: string;
}

export default function AccessKeysManagementPage() {
  const router = useRouter();
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterPostId, setFilterPostId] = useState('');
  const [filterExpired, setFilterExpired] = useState<'all' | 'active' | 'expired'>('all');
  
  const pageSize = 20;

  useEffect(() => {
    // 관리자 권한 확인
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/login');
      return;
    }
    
    loadAccessKeys();
  }, [currentPage, filterPostId, filterExpired, router]);

  const loadAccessKeys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (filterPostId) params.append('postId', filterPostId);
      if (filterExpired !== 'all') params.append('status', filterExpired);

      const response = await fetch(`/admin/access-keys?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('접근 코드 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setAccessKeys(data.keys || []);
      setTotalPages(Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error('Error loading access keys:', error);
      alert('접근 코드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (keyId: number) => {
    if (!confirm('정말 이 접근 코드를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/admin/access-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('접근 코드 삭제에 실패했습니다.');
      }

      alert('접근 코드가 삭제되었습니다.');
      loadAccessKeys();
    } catch (error) {
      console.error('Error deleting access key:', error);
      alert('접근 코드 삭제에 실패했습니다.');
    }
  };

  const handleUpdateExpiry = async (keyId: number, currentExpiry: string | null) => {
    const newDate = prompt('새 만료일을 입력하세요 (YYYY-MM-DD 형식):', 
      currentExpiry ? new Date(currentExpiry).toISOString().split('T')[0] : '');
    
    if (!newDate) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/admin/access-keys/${keyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expiresAt: new Date(newDate).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('만료일 수정에 실패했습니다.');
      }

      alert('만료일이 수정되었습니다.');
      loadAccessKeys();
    } catch (error) {
      console.error('Error updating expiry:', error);
      alert('만료일 수정에 실패했습니다.');
    }
  };

  const handleUpdateMemo = async (keyId: number, currentMemo: string | null) => {
    const newMemo = prompt('메모를 입력하세요:', currentMemo || '');
    
    if (newMemo === null) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/admin/access-keys/${keyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memo: newMemo,
        }),
      });

      if (!response.ok) {
        throw new Error('메모 수정에 실패했습니다.');
      }

      alert('메모가 수정되었습니다.');
      loadAccessKeys();
    } catch (error) {
      console.error('Error updating memo:', error);
      alert('메모 수정에 실패했습니다.');
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    alert('키값이 복사되었습니다.');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '무제한';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">접근 코드 전체 관리</h1>

        {/* 필터 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">필터</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">게시글 ID</label>
              <input
                type="text"
                value={filterPostId}
                onChange={(e) => {
                  setFilterPostId(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="게시글 ID로 필터링"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">상태</label>
              <select
                value={filterExpired}
                onChange={(e) => {
                  setFilterExpired(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="active">활성</option>
                <option value="expired">만료</option>
              </select>
            </div>
          </div>
        </div>

        {/* 접근 코드 목록 */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">로딩중...</div>
          ) : accessKeys.length === 0 ? (
            <div className="p-12 text-center text-gray-500">접근 코드가 없습니다.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">키</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">게시글 ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">메모</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">만료일</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">생성일</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessKeys.map((key) => (
                      <tr key={key.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{key.id}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {key.key.substring(0, 12)}...
                            </code>
                            <button
                              onClick={() => handleCopy(key.key)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              복사
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => router.push(`/post/${key.postId}`)}
                            className="text-blue-600 hover:underline"
                          >
                            {key.postId}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleUpdateMemo(key.id, key.memo)}
                            className="text-gray-700 hover:text-blue-600"
                          >
                            {key.memo || '(없음)'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleUpdateExpiry(key.id, key.expiresAt)}
                            className={`${
                              isExpired(key.expiresAt) ? 'text-red-600' : 'text-gray-700'
                            } hover:text-blue-600`}
                          >
                            {formatDate(key.expiresAt)}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(key.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleDelete(key.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="p-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  페이지 {currentPage} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    다음
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
