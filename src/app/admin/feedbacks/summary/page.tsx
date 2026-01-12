'use client';

import AdminLayout from '@/components/AdminLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface FeedbackSummary {
  postId: number;
  postTitle: string;
  totalFeedbacks: number;
  resolvedFeedbacks: number;
  unresolvedFeedbacks: number;
  resolutionRate: number;
}

export default function FeedbackSummaryPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<FeedbackSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 관리자 권한 확인
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/login');
      return;
    }
    
    loadSummary();
  }, [router]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/admin/feedbacks/summary', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('피드백 통계를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSummary(data || []);
    } catch (error) {
      console.error('Error loading feedback summary:', error);
      alert('피드백 통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressBarColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">게시물 문제 해결 비율 통계</h1>
          <button
            onClick={() => router.push('/admin/feedbacks')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            피드백 목록으로
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">로딩중...</div>
          ) : summary.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              피드백이 있는 게시물이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      게시글 ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      게시글 제목
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      전체 피드백
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      해결됨
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      미해결
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      해결 비율
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((item) => (
                    <tr key={item.postId} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => router.push(`/post/${item.postId}`)}
                          className="text-blue-600 hover:underline"
                        >
                          {item.postId}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.postTitle || '(제목 없음)'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {item.totalFeedbacks}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-green-600">
                        {item.resolvedFeedbacks}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-red-600">
                        {item.unresolvedFeedbacks}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-full ${getProgressBarColor(
                                item.resolutionRate
                              )} transition-all duration-300`}
                              style={{ width: `${item.resolutionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                            {item.resolutionRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 전체 통계 요약 */}
        {!loading && summary.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-2">총 게시물</div>
              <div className="text-3xl font-bold text-gray-900">{summary.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-2">총 피드백</div>
              <div className="text-3xl font-bold text-blue-600">
                {summary.reduce((sum, item) => sum + item.totalFeedbacks, 0)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-2">해결된 피드백</div>
              <div className="text-3xl font-bold text-green-600">
                {summary.reduce((sum, item) => sum + item.resolvedFeedbacks, 0)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-2">전체 해결율</div>
              <div className="text-3xl font-bold text-purple-600">
                {(
                  (summary.reduce((sum, item) => sum + item.resolvedFeedbacks, 0) /
                    summary.reduce((sum, item) => sum + item.totalFeedbacks, 0)) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
