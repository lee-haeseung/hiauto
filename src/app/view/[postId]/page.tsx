'use client';

import AccessKeyLayout from '@/components/AccessKeyLayout';
import FeedbackSection from '@/components/FeedbackSection';
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

export default function ViewPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 액세스 키 권한 확인
    const role = localStorage.getItem('role');
    
    if (role !== 'access-key') {
      setError('접근 권한이 없습니다.');
      setLoading(false);
      return;
    }
    
    // 서버에서 JWT 토큰으로 권한을 확인하므로 클라이언트에서는 체크하지 않음
    if (postId) {
      loadPost();
    }
  }, [postId, router]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const data = await apiGet<Post>(`/api/posts/${postId}`, token || undefined);

      setPost(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다.';
      
      // 권한 없음 에러인 경우 로그인 페이지로 리다이렉트
      if (errorMessage.includes('권한') || errorMessage.includes('로그인')) {
        alert('이 게시글에 접근할 권한이 없습니다. 액세스 키를 다시 입력해주세요.');
        router.push('/login');
        return;
      }
      
      setError(errorMessage);
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

  // 우클릭 방지
  const preventContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // 드래그 방지
  const preventDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  // 복사 방지 (선택적으로 사용)
  const preventCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <AccessKeyLayout>
      <div 
        className="p-8"
        onContextMenu={preventContextMenu}
        onDragStart={preventDragStart}
        onCopy={preventCopy}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">로딩중...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
            {error}
          </div>
        ) : post ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* 왼쪽 콘텐츠 영역 (4) */}
            <div className="lg:col-span-4">
              {/* 제목 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
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
                  className="prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-125 p-6 post-content no-select"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>

              {/* 피드백 섹션 */}
              <FeedbackSection postId={post.id} />
            </div>

            {/* 오른쪽 광고 영역 (1) - 1024px 이상에서만 표시 */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-8">
                {/* 광고 공간 - 필요시 여기에 광고 컴포넌트 삽입 */}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            게시글을 찾을 수 없습니다.
          </div>
        )}
      </div>
    </AccessKeyLayout>
  );
}
