'use client';

import AdminLayout from '@/components/AdminLayout';
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
}

export default function FeedbacksManagementPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterPostId, setFilterPostId] = useState('');
  const [filterResolved, setFilterResolved] = useState<'all' | 'resolved' | 'unresolved'>('all');
  
  const pageSize = 20;

  useEffect(() => {
    // 관리자 권한 확인
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/login');
      return;
    }
    
    loadFeedbacks();
  }, [currentPage, filterPostId, filterResolved, router]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (filterPostId) params.append('postId', filterPostId);
      if (filterResolved !== 'all') {
        params.append('isResolved', filterResolved === 'resolved' ? 'true' : 'false');
      }

      const response = await fetch(`/admin/feedbacks?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('피드백 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setFeedbacks(data.feedbacks || []);
      setTotalPages(Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      alert('피드백을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = (feedbackId: number) => {
    router.push(`/admin/feedbacks/${feedbackId}`);
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

  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">피드백 관리</h1>
          <button
            onClick={() => router.push('/admin/feedbacks/summary')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            통계 보기
          </button>
        </div>

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
              <label className="block text-sm font-medium mb-2">해결 상태</label>
              <select
                value={filterResolved}
                onChange={(e) => {
                  setFilterResolved(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="resolved">해결됨</option>
                <option value="unresolved">미해결</option>
              </select>
            </div>
          </div>
        </div>

        {/* 피드백 목록 */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">로딩중...</div>
          ) : feedbacks.length === 0 ? (
            <div className="p-12 text-center text-gray-500">피드백이 없습니다.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">게시글 ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">내용</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">상태</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">작성일</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((feedback) => (
                      <tr key={feedback.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{feedback.id}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => router.push(`/post/${feedback.postId}`)}
                            className="text-blue-600 hover:underline"
                          >
                            {feedback.postId}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {truncateContent(feedback.content)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              feedback.isResolved
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {feedback.isResolved ? '해결됨' : '미해결'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(feedback.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleViewFeedback(feedback.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                          >
                            보기
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
