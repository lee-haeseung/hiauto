'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client';

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
  
  // 필터링 상태 (입력용)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expiredFilter, setExpiredFilter] = useState<'all' | 'active' | 'expired'>('all');
  
  // 실제 적용된 필터 (검색 버튼 클릭 시 업데이트)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedExpiredFilter, setAppliedExpiredFilter] = useState<'all' | 'active' | 'expired'>('all');
  
  // 생성 폼 상태
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [memo, setMemo] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);
  
  // 수정 폼 상태
  const [editingKey, setEditingKey] = useState<AccessKey | null>(null);
  const [editMemo, setEditMemo] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [updating, setUpdating] = useState(false);
  
  const pageSize = 10;

  useEffect(() => {
    loadAccessKeys();
  }, [currentPage, postId, appliedSearch, appliedExpiredFilter]);

  // 15일 후 날짜를 YYYY-MM-DDTHH:mm 형식으로 반환
  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (showCreateForm && !expiresAt) {
      setExpiresAt(getDefaultExpiryDate());
    }
  }, [showCreateForm]);

  const loadAccessKeys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // 쿼리 파라미터 구성
      const params = new URLSearchParams({
        postId: postId.toString(),
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (appliedSearch.trim()) {
        params.append('search', appliedSearch.trim());
      }
      
      if (appliedExpiredFilter === 'active') {
        params.append('isExpired', 'false');
      } else if (appliedExpiredFilter === 'expired') {
        params.append('isExpired', 'true');
      }

      const data = await apiGet<{
        keys: AccessKey[];
        total: number;
        totalPages: number;
      }>(`/api/admin/access-keys?${params.toString()}`, token || '');
      
      setAccessKeys(data.keys);
      setTotalPages(data.totalPages);
    } catch {
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

    if (!expiresAt) {
      alert('만료일을 선택해주세요.');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      
      const expiryDate = new Date(expiresAt);
      
      await apiPost(
        '/api/admin/access-keys',
        {
          postId,
          memo: memo.trim(),
          expiresAt: expiryDate.toISOString(),
        },
        token || ''
      );

      alert('액세스 키가 생성되었습니다.');
      setMemo('');
      setExpiresAt('');
      setShowCreateForm(false);
      setCurrentPage(1);
      loadAccessKeys();
    } catch (error: any) {
      alert(`생성 실패: ${error.message || '액세스 키 생성에 실패했습니다.'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (key: AccessKey) => {
    setEditingKey(key);
    setEditMemo(key.memo || '');
    
    if (key.expiresAt) {
      const date = new Date(key.expiresAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setEditExpiresAt(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setEditExpiresAt(getDefaultExpiryDate());
    }
  };

  const handleUpdate = async () => {
    if (!editingKey) return;

    if (!editExpiresAt) {
      alert('만료일을 선택해주세요.');
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      await apiPatch(
        `/api/admin/access-keys/${editingKey.id}`,
        {
          memo: editMemo.trim(),
          expiresAt: new Date(editExpiresAt).toISOString(),
        },
        token || ''
      );

      alert('액세스 키가 수정되었습니다.');
      setEditingKey(null);
      setEditMemo('');
      setEditExpiresAt('');
      loadAccessKeys();
    } catch (error: any) {
      alert(error.message || '액세스 키 수정에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (keyId: number) => {
    if (!confirm('정말 이 액세스 키를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await apiDelete(
        `/api/admin/access-keys/${keyId}`,
        token || ''
      );

      alert('액세스 키가 삭제되었습니다.');
      loadAccessKeys();
    } catch (error: any) {
      alert(error.message || '액세스 키 삭제에 실패했습니다.');
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchKeyword);
    setAppliedExpiredFilter(expiredFilter);
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
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
          {/* 필터링 영역 */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    키워드 검색 (키값, 메모)
                  </label>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="검색어를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium mb-1">
                    만료 여부
                  </label>
                  <select
                    value={expiredFilter}
                    onChange={(e) => {
                      setExpiredFilter(e.target.value as 'all' | 'active' | 'expired');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">전체</option>
                    <option value="active">활성</option>
                    <option value="expired">만료됨</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    검색
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* 생성 버튼 */}
          <div className="mb-4">
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                if (!showCreateForm) {
                  setMemo('');
                  setExpiresAt(getDefaultExpiryDate());
                }
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              {showCreateForm ? '취소' : '액세스 키 생성'}
            </button>
          </div>

          {/* 생성 폼 */}
          {showCreateForm && (
            <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50">
              <h3 className="font-semibold mb-3">새 액세스 키 생성</h3>
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
                <div>
                  <label className="block text-sm font-medium mb-1">
                    만료일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    기본값: 15일 후
                  </p>
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
                      setExpiresAt('');
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
              {appliedSearch || appliedExpiredFilter !== 'all'
                ? '검색 결과가 없습니다.'
                : '생성된 액세스 키가 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      상태
                    </th>
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
                    <tr
                      key={key.id}
                      className={`hover:bg-gray-50 ${
                        isExpired(key.expiresAt) ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">
                        {isExpired(key.expiresAt) ? (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                            만료
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                            활성
                          </span>
                        )}
                      </td>
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
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(key)}
                            className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(key.id)}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                          >
                            삭제
                          </button>
                        </div>
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

        {/* 수정 모달 */}
        {editingKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4">액세스 키 수정</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    키값 (수정 불가)
                  </label>
                  <input
                    type="text"
                    value={editingKey.key}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    메모
                  </label>
                  <input
                    type="text"
                    value={editMemo}
                    onChange={(e) => setEditMemo(e.target.value)}
                    placeholder="메모를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    만료일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    {updating ? '수정 중...' : '수정'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingKey(null);
                      setEditMemo('');
                      setEditExpiresAt('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
