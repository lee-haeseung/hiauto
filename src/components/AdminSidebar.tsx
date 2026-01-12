'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [subBoards, setSubBoards] = useState<{ [key: number]: SubBoard[] }>({});
  const [expandedBoards, setExpandedBoards] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        // boards와 subBoards를 병렬로 가져오기
        const [boardsResponse, subBoardsResponse] = await Promise.all([
          fetch('/api/admin/boards', { headers }),
          fetch('/api/admin/sub-boards', { headers })
        ]);

        if (boardsResponse.status === 401 || boardsResponse.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          window.location.href = '/admin/login';
          return;
        }

        const boardsData = await boardsResponse.json();
        const subBoardsData = await subBoardsResponse.json();

        if (!mounted) return;

        // boards 데이터 설정
        setBoards(boardsData.success ? boardsData.data : []);

        // subBoards를 boardId별로 그룹화
        if (subBoardsData.success) {
          const groupedSubBoards: { [key: number]: SubBoard[] } = {};
          subBoardsData.data.forEach((subBoard: SubBoard) => {
            if (!groupedSubBoards[subBoard.boardId]) {
              groupedSubBoards[subBoard.boardId] = [];
            }
            groupedSubBoards[subBoard.boardId].push(subBoard);
          });
          setSubBoards(groupedSubBoards);
        }
      } catch (error) {
        console.error('Failed to load boards and sub-boards:', error);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleBoard = (boardId: number) => {
    setExpandedBoards((prev) => ({
      ...prev,
      [boardId]: !prev[boardId],
    }));
  };

  return (
    <div className="w-64 h-screen bg-gray-100 border-r border-gray-300 flex flex-col">
      {/* 버튼 영역 */}
      <div className="p-4 border-b border-gray-300">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => router.push('/search')}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
          >
            검색
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition font-medium"
          >
            설정
          </button>
        </div>
        <button
          onClick={() => router.push('/write')}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium mb-2"
        >
          글쓰기
        </button>
        <button
          onClick={() => router.push('/admin/feedbacks')}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition font-medium"
        >
          피드백 관리
        </button>
      </div>

      {/* 게시판 목록 */}
      <div className="flex-1 overflow-y-auto">
        {boards.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm">게시판이 없습니다.</div>
        ) : (
          boards.map((board) => (
              <div key={board.id} className="border-b border-gray-200">
                {/* Board 헤더 */}
                <button
                  onClick={() => toggleBoard(board.id)}
                  className="w-full px-4 py-3 text-left font-semibold hover:bg-gray-200 flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <span className="mr-2">
                      {expandedBoards[board.id] ? '▼' : '▶'}
                    </span>
                    {board.name}
                  </span>
                </button>

                {/* SubBoards */}
                {expandedBoards[board.id] && subBoards[board.id] && (
                  <div className="bg-white">
                    {subBoards[board.id].length === 0 ? (
                      <div className="px-4 py-2 text-gray-400 text-sm pl-8">
                        하위 게시판이 없습니다.
                      </div>
                    ) : (
                      subBoards[board.id].map((subBoard) => (
                        <Link
                          key={subBoard.id}
                          href={`/board/${subBoard.id}`}
                          className={`block px-4 py-2 pl-8 text-sm hover:bg-blue-50 ${
                            pathname === `/board/${subBoard.id}`
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {subBoard.name}
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
