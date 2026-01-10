'use client';

import AccessKeyLayout from '@/components/AccessKeyLayout';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function ViewPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [subBoard, setSubBoard] = useState<SubBoard | null>(null);
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
      
      // 하위 게시판 정보 가져오기
      if (data.subBoardId) {
        const subBoardResponse = await fetch(`/api/sub-boards?subBoardId=${data.subBoardId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (subBoardResponse.ok) {
          const subBoardData = await subBoardResponse.json();
          setSubBoard(subBoardData);
          
          // 게시판 정보 가져오기
          if (subBoardData.boardId) {
            const boardResponse = await fetch(`/api/boards`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (boardResponse.status === 401 || boardResponse.status === 403) {
              localStorage.removeItem('token');
              window.location.href = '/login';
              return;
            }
            
            if (boardResponse.ok) {
              const boards = await boardResponse.json();
              const foundBoard = boards.find((b: Board) => b.id === subBoardData.boardId);
              if (foundBoard) {
                setBoard(foundBoard);
              }
            }
          }
        }
      }
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
                className="prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[500px] p-6 post-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* 버튼 그룹 */}
            {subBoard && (
              <div className="mt-6">
                <button
                  onClick={() => router.push(`/board/${subBoard.id}`)}
                  className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  목록으로
                </button>
              </div>
            )}
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
