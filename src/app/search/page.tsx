'use client';

import AdminLayout from '@/components/AdminLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Board {
  id: number;
  name: string;
}

interface SubBoard {
  id: number;
  boardId: number;
  name: string;
}

interface SearchResult {
  id: number;
  title: string;
  subBoardId: number;
  createdAt: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [target, setTarget] = useState<'title' | 'content' | 'all'>('all');
  const [boardId, setBoardId] = useState<string>('');
  const [subBoardId, setSubBoardId] = useState<string>('');
  const [boards, setBoards] = useState<Board[]>([]);
  const [subBoards, setSubBoards] = useState<SubBoard[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (boardId) {
      loadSubBoards(parseInt(boardId));
    } else {
      setSubBoards([]);
      setSubBoardId('');
    }
  }, [boardId]);

  const loadBoards = async () => {
    try {
      const response = await fetch('/api/boards');
      const data = await response.json();
      setBoards(data || []);
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  };

  const loadSubBoards = async (id: number) => {
    try {
      const response = await fetch(`/api/sub-boards?boardId=${id}`);
      const data = await response.json();
      setSubBoards(data || []);
    } catch (error) {
      console.error('Failed to load sub-boards:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      alert('검색어를 입력하세요.');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        query: searchQuery,
        target,
      });

      if (boardId) params.append('boardId', boardId);
      if (subBoardId) params.append('subBoardId', subBoardId);

      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('검색에 실패했습니다.');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      alert('검색 중 오류가 발생했습니다.');
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
    });
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">게시글 검색</h1>

        {/* 검색 폼 */}
        <form onSubmit={handleSearch} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          {/* 검색어 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색어 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="검색할 내용을 입력하세요"
            />
          </div>

          {/* 검색 대상 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색 대상
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={target === 'all'}
                  onChange={(e) => setTarget(e.target.value as any)}
                  className="mr-2"
                />
                전체
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="title"
                  checked={target === 'title'}
                  onChange={(e) => setTarget(e.target.value as any)}
                  className="mr-2"
                />
                제목
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="content"
                  checked={target === 'content'}
                  onChange={(e) => setTarget(e.target.value as any)}
                  className="mr-2"
                />
                내용
              </label>
            </div>
          </div>

          {/* 게시판 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              타겟 게시판 (선택사항)
            </label>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 게시판</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </div>

          {/* 서브게시판 선택 */}
          {boardId && subBoards.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                타겟 서브게시판 (선택사항)
              </label>
              <select
                value={subBoardId}
                onChange={(e) => setSubBoardId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체 서브게시판</option>
                {subBoards.map((subBoard) => (
                  <option key={subBoard.id} value={subBoard.id}>
                    {subBoard.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 검색 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </form>

        {/* 검색 결과 */}
        {searched && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              검색 결과 ({results.length}개)
            </h2>

            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                검색 결과가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {results.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => router.push(`/post/${result.id}`)}
                    className="py-4 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <h3 className="text-blue-600 font-medium mb-1">
                      {result.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      작성일: {formatDate(result.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
