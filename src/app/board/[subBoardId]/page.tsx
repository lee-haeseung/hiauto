'use client';

import AdminLayout from '@/components/AdminLayout';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Post {
  id: number;
  title: string;
  createdAt: string;
}

export default function BoardPage() {
  const params = useParams();
  const subBoardId = params?.subBoardId as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTarget, setSearchTarget] = useState<'all' | 'title' | 'content'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (subBoardId) {
      loadPosts();
    }
  }, [subBoardId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts?subBoardId=${subBoardId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('게시글을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setAllPosts(data);
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setPosts(allPosts);
      return;
    }

    try {
      const params = new URLSearchParams({
        query: searchQuery,
        target: searchTarget,
        subBoardId: subBoardId,
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/search?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('검색에 실패했습니다.');
      }

      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Search error:', error);
      alert('검색 중 오류가 발생했습니다.');
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchTarget('all');
    setPosts(allPosts);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">게시글 목록</h1>
        </div>

        {/* 검색 바 */}
        <div className="mb-4 flex items-center gap-2">
          <select 
            value={searchTarget} 
            onChange={(e) => setSearchTarget(e.target.value as any)}
            className="px-3 py-2 border"
          >
            <option value="all">전체</option>
            <option value="title">제목</option>
            <option value="content">내용</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-3 py-2 border"
            placeholder="검색어를 입력하세요"
          />
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white">
            검색
          </button>
          <button onClick={handleReset} className="px-4 py-2 bg-gray-400 text-white">
            초기화
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">로딩중...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            게시글이 없습니다.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    작성일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {posts.map((post, index) => (
                  <tr
                    key={post.id}
                    onClick={() => window.location.href = `/post/${post.id}`}
                    className="hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {posts.length - index}
                    </td>
                    <td className="px-6 py-4 text-blue-600">
                      {post.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
