'use client';

import AdminLayout from '@/components/AdminLayout';
import { apiGet } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Feedback {
  id: number;
  postId: number;
  accessKeyId: number;
  content: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  postTitle?: string;
  phone?: string;
  description?: string;
  isSolved?: boolean;
  accessKeyMemo?: string | null;
}

export default function FeedbacksManagementPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterPostId, setFilterPostId] = useState('');
  const [filterResolved, setFilterResolved] = useState<'all' | 'resolved' | 'unresolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 관리자 권한 확인
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/login');
      return;
    }
    
    loadFeedbacks();
  }, [currentPage, pageSize, router]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || undefined;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (filterPostId) params.append('postId', filterPostId);
      if (filterResolved !== 'all') {
        params.append('isSolved', filterResolved === 'resolved' ? 'true' : 'false');
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const data = await apiGet<{ items: Feedback[]; total: number; page: number; pageSize: number; totalPages: number }>(
        `/api/admin/feedbacks?${params.toString()}`,
        token
      );
      
      setFeedbacks(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error('피드백 로딩 에러:', error);
      alert('피드백을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadFeedbacks();
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterPostId('');
    setFilterResolved('all');
    setCurrentPage(1);
    // 초기화 후 검색 실행
    setTimeout(() => loadFeedbacks(), 0);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFeedbackDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    });
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">피드백 관리</h1>
        </div>

        {/* 검색 및 필터 폼 */}
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="border border-gray-200 rounded-lg p-6 mb-4 bg-white">
          <h2 className="text-lg font-semibold mb-4">검색 및 필터</h2>
          
          {/* 검색어 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">검색어</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="피드백 내용 검색..."
            />
          </div>

          {/* 필터 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">게시글 ID</label>
              <input
                type="text"
                value={filterPostId}
                onChange={(e) => setFilterPostId(e.target.value)}
                placeholder="게시글 ID로 필터링"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">해결 상태</label>
              <select
                value={filterResolved}
                onChange={(e) => setFilterResolved(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="resolved">해결됨</option>
                <option value="unresolved">미해결</option>
              </select>
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? '검색 중...' : '검색'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 transition"
            >
              초기화
            </button>
          </div>
        </form>

        {/* 페이지네이션 정보 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-base text-gray-700">
            전체개수: <span className="font-semibold">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">노출개수:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-1 border rounded"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* 피드백 목록 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩중...</div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">피드백이 없습니다.</div>
          ) : (
            <>
              {/* 피드백 카드 목록 */}
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <div key={feedback.id} className="bg-blue-50 border border-blue-200 rounded-lg p-6 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="font-medium text-gray-700">피드백 ID: </span>
                        <span className="text-gray-900">{feedback.id}</span>
                        <span className="mx-2 text-gray-400">|</span>
                        <button
                          onClick={() => router.push(`/post/${feedback.postId}`)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          게시글 #{feedback.postId}
                        </button>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          feedback.isResolved || feedback.isSolved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {feedback.isResolved || feedback.isSolved ? '예 (해결됨)' : '아니오 (미해결)'}
                      </span>
                    </div>
                    
                    {feedback.accessKeyMemo && (
                      <div className="mb-3">
                        <span className="font-medium text-gray-700">메모: </span>
                        <span className="text-gray-600">{feedback.accessKeyMemo}</span>
                      </div>
                    )}
                    
                    {(!feedback.isResolved && !feedback.isSolved) && (
                      <>
                        {feedback.phone && (
                          <div className="mb-3">
                            <span className="font-medium text-gray-700">연락처: </span>
                            <span className="text-gray-900">{feedback.phone}</span>
                          </div>
                        )}
                        {feedback.description && (
                          <div className="mb-4">
                            <div className="font-medium text-gray-700 mb-2">상세 내용:</div>
                            <div
                              className="prose prose-sm sm:prose lg:prose-lg max-w-none p-4 bg-white rounded border border-gray-200 post-content"
                              dangerouslySetInnerHTML={{ __html: feedback.description }}
                            />
                          </div>
                        )}
                        {feedback.content && !feedback.description && (
                          <div className="mb-4">
                            <div className="font-medium text-gray-700 mb-2">내용:</div>
                            <div className="p-4 bg-white rounded border border-gray-200">
                              {feedback.content}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      작성일: {formatFeedbackDate(feedback.createdAt)}
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    이전
                  </button>
                  {renderPageNumbers()}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
