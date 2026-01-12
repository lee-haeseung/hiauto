'use client';

import AccessKeyManagementModal from '@/components/AccessKeyManagementModal';
import AdminLayout from '@/components/AdminLayout';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api/client';

interface Post {
  id: number;
  subBoardId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Board {
  id: number;
  name: string;
}

interface SubBoard {
  id: number;
  name: string;
  boardId: number;
}

interface FeedbackSummary {
  total: number;
  solved: number;
  unsolved: number;
  solveRate: number;
}

interface Feedback {
  id: number;
  postId: number;
  phone: string;
  description: string;
  isSolved: boolean;
  accessKeyMemo: string | null;
  createdAt: string;
}

interface FeedbacksResponse {
  items: Feedback[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [subBoard, setSubBoard] = useState<SubBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAccessKeyModal, setShowAccessKeyModal] = useState(false);
  
  // 피드백 관련 상태
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackPageSize, setFeedbackPageSize] = useState(20);
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(0);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    // 관리자 권한 확인
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/login');
      return;
    }
    
    if (postId) {
      loadPost();
      loadFeedbackSummary();
      loadFeedbacks();
    }
  }, [postId, router]);

  useEffect(() => {
    if (postId) {
      loadFeedbacks();
    }
  }, [feedbackPage, feedbackPageSize]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || undefined;
      
      // 게시글 정보 가져오기 (/api/posts/[postId] 사용)
      const data = await apiGet<Post>(`/api/posts/${postId}`, token);
      setPost(data);
      
      // 하위 게시판 정보 가져오기
      if (data.subBoardId) {
        // 모든 게시판 정보 가져오기
        const boards = await apiGet<Board[]>(`/api/admin/boards`, token);
        
        // 모든 서브보드 정보 가져오기
        const subBoards = await apiGet<SubBoard[]>(`/api/admin/sub-boards`, token);
        const foundSubBoard = subBoards.find((sb: SubBoard) => sb.id === data.subBoardId);
        
        if (foundSubBoard) {
          setSubBoard(foundSubBoard);
          
          // 게시판 정보 찾기
          const foundBoard = boards.find((b: Board) => b.id === foundSubBoard.boardId);
          if (foundBoard) {
            setBoard(foundBoard);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      // 인증 에러 시 로그인 페이지로 이동
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('인증'))) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbackSummary = async () => {
    try {
      const token = localStorage.getItem('token') || undefined;
      const summary = await apiGet<FeedbackSummary>(
        `/api/admin/feedbacks/summary?postId=${postId}`,
        token
      );
      setFeedbackSummary(summary);
    } catch (err) {
      console.error('Failed to load feedback summary:', err);
    }
  };

  const loadFeedbacks = async () => {
    try {
      setFeedbackLoading(true);
      const token = localStorage.getItem('token') || undefined;
      const params = new URLSearchParams({
        postId: postId,
        page: feedbackPage.toString(),
        pageSize: feedbackPageSize.toString(),
      });
      if (feedbackSearch.trim()) {
        params.append('search', feedbackSearch);
      }
      const data = await apiGet<FeedbacksResponse>(
        `/api/admin/feedbacks?${params.toString()}`,
        token
      );
      setFeedbacks(data.items);
      setFeedbackTotal(data.total);
      setFeedbackTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load feedbacks:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleFeedbackSearch = () => {
    setFeedbackPage(1);
    loadFeedbacks();
  };

  const handleFeedbackReset = () => {
    setFeedbackSearch('');
    setFeedbackPage(1);
    loadFeedbacks();
  };

  const handleFeedbackPageSizeChange = (newSize: number) => {
    setFeedbackPageSize(newSize);
    setFeedbackPage(1);
  };

  const handleFeedbackPageChange = (page: number) => {
    setFeedbackPage(page);
  };

  const renderFeedbackPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, feedbackPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(feedbackTotalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handleFeedbackPageChange(i)}
          className={`px-3 py-1 border ${i === feedbackPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">로딩중...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
            {error}
          </div>
        ) : post ? (
          <div className="max-w-4xl mx-auto">
            {/* 제목 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
              {board && subBoard && (
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {board.name} &gt; {subBoard.name}
                  </span>
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>작성일: {formatDate(post.createdAt)}</span>
                {post.updatedAt !== post.createdAt && (
                  <span>수정일: {formatDate(post.updatedAt)}</span>
                )}
              </div>
            </div>

            {/* 내용 */}
            <div className="border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden">
              <div
                className="prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-125 p-6 post-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* 버튼 그룹 */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push(`/board/${post.subBoardId}`)}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
              >
                목록으로
              </button>
              <button
                onClick={() => router.push(`/write?postId=${postId}`)}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                수정
              </button>
              <button
                onClick={() => setShowAccessKeyModal(true)}
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                접근 코드 관리
              </button>
            </div>

            {/* 피드백 요약 */}
            {feedbackSummary && (
              <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">피드백 요약</h2>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-gray-600">전체</div>
                    <div className="text-2xl font-bold text-blue-600">{feedbackSummary.total}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-gray-600">해결 (예)</div>
                    <div className="text-2xl font-bold text-green-600">{feedbackSummary.solved}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded">
                    <div className="text-sm text-gray-600">미해결 (아니오)</div>
                    <div className="text-2xl font-bold text-red-600">{feedbackSummary.unsolved}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <div className="text-sm text-gray-600">해결률</div>
                    <div className="text-2xl font-bold text-purple-600">{feedbackSummary.solveRate}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* 피드백 목록 */}
            <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">피드백 목록</h2>
              
              {/* 검색 바 */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFeedbackSearch()}
                  className="flex-1 px-3 py-2 border rounded"
                  placeholder="전화번호, 설명, 메모로 검색"
                />
                <button onClick={handleFeedbackSearch} className="px-4 py-2 bg-blue-600 text-white rounded">
                  검색
                </button>
                <button onClick={handleFeedbackReset} className="px-4 py-2 bg-gray-400 text-white rounded">
                  초기화
                </button>
              </div>

              {/* 페이지네이션 정보 */}
              <div className="mb-4 flex items-center justify-between">
                <div className="text-base text-gray-700">
                  전체개수: <span className="font-semibold">{feedbackTotal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">노출개수:</span>
                  <select
                    value={feedbackPageSize}
                    onChange={(e) => handleFeedbackPageSizeChange(Number(e.target.value))}
                    className="px-3 py-1 border rounded"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {feedbackLoading ? (
                <div className="text-center py-8 text-gray-500">로딩중...</div>
              ) : feedbacks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">피드백이 없습니다.</div>
              ) : (
                <>
                  {/* 피드백 카드 목록 */}
                  <div className="space-y-4">
                    {feedbacks.map((feedback) => (
                      <div key={feedback.id} className="bg-blue-50 border border-blue-200 rounded-lg p-6 relative">
                        <div className="mb-4">
                          <span className="font-medium text-gray-700">내 피드백: </span>
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              feedback.isSolved
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {feedback.isSolved ? '예 (해결됨)' : '아니오 (미해결)'}
                          </span>
                        </div>
                        
                        {feedback.accessKeyMemo && (
                          <div className="mb-3">
                            <span className="font-medium text-gray-700">메모: </span>
                            <span className="text-gray-600">{feedback.accessKeyMemo}</span>
                          </div>
                        )}
                        
                        {!feedback.isSolved && (
                          <>
                            <div className="mb-3">
                              <span className="font-medium text-gray-700">연락처: </span>
                              <span className="text-gray-900">{feedback.phone}</span>
                            </div>
                            <div className="mb-4">
                              <div className="font-medium text-gray-700 mb-2">상세 내용:</div>
                              <div
                                className="prose prose-sm sm:prose lg:prose-lg max-w-none p-4 bg-white rounded border border-gray-200 post-content"
                                dangerouslySetInnerHTML={{ __html: feedback.description }}
                              />
                            </div>
                          </>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          작성일: {formatFeedbackDate(feedback.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 페이지네이션 */}
                  {feedbackTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => handleFeedbackPageChange(feedbackPage - 1)}
                        disabled={feedbackPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        이전
                      </button>
                      {renderFeedbackPageNumbers()}
                      <button
                        onClick={() => handleFeedbackPageChange(feedbackPage + 1)}
                        disabled={feedbackPage === feedbackTotalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        다음
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 액세스 키 관리 모달 */}
            {showAccessKeyModal && (
              <AccessKeyManagementModal
                postId={parseInt(postId)}
                onClose={() => setShowAccessKeyModal(false)}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            게시글을 찾을 수 없습니다.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
