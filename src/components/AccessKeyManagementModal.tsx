'use client';

import { useEffect, useState } from 'react';

interface AccessKey {
  id: number;
  key: string;
  memo: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface AccessKeyManagementModalProps {
  postId: number;
  onClose: () => void;
}

export default function AccessKeyManagementModal({
  postId,
  onClose,
}: AccessKeyManagementModalProps) {
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [memo, setMemo] = useState('');
  const [creating, setCreating] = useState(false);
  
  const pageSize = 10;

  useEffect(() => {
    loadAccessKeys();
  }, [currentPage, postId]);

  const loadAccessKeys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/admin/access-keys?postId=${postId}&page=${currentPage}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('액세스 키 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setAccessKeys(data.keys);
      setTotalPages(Math.ceil(data.total / pageSize));
    } catch (error) {
      console.error('Error loading access keys:', error);
      alert('액세스 키를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!memo.trim()) {
      alert('메모를 입력해주세요.');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      
      // 7일 후 만료일 계산
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const response = await fetch(`/admin/access-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postId,
          memo,
          expiresAt: expiresAt.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('액세스 키 생성에 실패했습니다.');
      }

      alert('액세스 키가 생성되었습니다.');
      setMemo('');
      setShowCreateForm(false);
      loadAccessKeys();
    } catch (error) {
      console.error('Error creating access key:', error);
      alert('액세스 키 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (keyId: number) => {
    if (!confirm('정말 이 액세스 키를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/admin/access-keys/${keyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('액세스 키 삭제에 실패했습니다.');
      }

      alert('액세스 키가 삭제되었습니다.');
      loadAccessKeys();
    } catch (error) {
      console.error('Error deleting access key:', error);
      alert('액세스 키 삭제에 실패했습니다.');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gray-100 px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">접근 코드 관리</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 생성 버튼 */}
          <div className="mb-4">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              {showCreateForm ? '취소' : '액세스 키 생성'}
            </button>
          </div>

          {/* 생성 폼 */}
          {showCreateForm && (
            <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50">
              <h3 className="font-semibold mb-3">새 액세스 키 생성</h3>
              <p className="text-sm text-gray-600 mb-3">
                생성된 액세스 키는 7일 후 자동으로 만료됩니다.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    메모 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="메모를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {creating ? '생성 중...' : '생성'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setMemo('');
                    }}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 액세스 키 목록 */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : accessKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              생성된 액세스 키가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      키값
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      메모
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      만료일
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accessKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-xs">{key.key}</span>
                          <button
                            onClick={() => handleCopy(key.key)}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                          >
                            복사
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{key.memo || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(key.expiresAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(key.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
