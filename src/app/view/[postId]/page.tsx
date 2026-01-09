'use client';

import AccessKeyLayout from '@/components/AccessKeyLayout';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Post {
  id: number;
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
    const storedPostId = localStorage.getItem('postId');
    
    if (role !== 'access-key') {
      setError('접근 권한이 없습니다.');
      setLoading(false);
      return;
    }
    
    // 액세스 키는 할당된 게시물만 조회 가능
    if (storedPostId !== postId) {
      setError('접근 권한이 없는 게시글입니다.');
      setLoading(false);
      return;
    }
    
    if (postId) {
      loadPost();
    }
  }, [postId, router]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('게시글을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setPost(data);
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
    <AccessKeyLayout>
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
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
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
