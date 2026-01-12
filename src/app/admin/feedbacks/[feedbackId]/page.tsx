'use client';

import AdminLayout from '@/components/AdminLayout';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Feedback {
  id: number;
  postId: number;
  accessKeyId: number;
  content: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const feedbackId = params?.feedbackId as string;
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 관리자 권한 확인
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/login');
      return;
    }
    
    if (feedbackId) {
      loadFeedback();
    }
  }, [feedbackId, router]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/feedbacks/${feedbackId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('피드백을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setFeedback(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← 뒤로 가기
            </button>
            <h1 className="text-3xl font-bold">피드백 상세</h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">로딩중...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
              {error}
            </div>
          ) : feedback ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="border-b bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">피드백 ID: {feedback.id}</div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          feedback.isResolved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {feedback.isResolved ? '해결됨' : '미해결'}
                      </span>
                      <button
                        onClick={() => router.push(`/post/${feedback.postId}`)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        게시글 보기 (ID: {feedback.postId})
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">피드백 내용</h2>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap">
                    {feedback.content}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">작성일:</span>
                    <span className="ml-2 text-gray-900">{formatDate(feedback.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">수정일:</span>
                    <span className="ml-2 text-gray-900">{formatDate(feedback.updatedAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">게시글 ID:</span>
                    <span className="ml-2 text-gray-900">{feedback.postId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">접근 코드 ID:</span>
                    <span className="ml-2 text-gray-900">{feedback.accessKeyId}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">피드백을 찾을 수 없습니다.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
