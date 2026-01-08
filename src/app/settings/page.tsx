'use client';

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState } from 'react';

interface Board {
  id: number;
  name: string;
  order: number;
}

interface SubBoard {
  id: number;
  boardId: number;
  name: string;
  order: number;
}

export default function SettingsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [subBoards, setSubBoards] = useState<{ [key: number]: SubBoard[] }>({});
  const [expandedBoards, setExpandedBoards] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const response = await fetch('/api/boards');
      const data = await response.json();
      setBoards(data || []);

      for (const board of data) {
        loadSubBoards(board.id);
      }
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  };

  const loadSubBoards = async (boardId: number) => {
    try {
      const response = await fetch(`/api/sub-boards?boardId=${boardId}`);
      const data = await response.json();
      setSubBoards((prev) => ({ ...prev, [boardId]: data || [] }));
    } catch (error) {
      console.error(`Failed to load sub-boards for board ${boardId}:`, error);
    }
  };

  const toggleBoard = (boardId: number) => {
    setExpandedBoards((prev) => ({
      ...prev,
      [boardId]: !prev[boardId],
    }));
  };

  const handleAddBoard = async () => {
    const name = prompt('게시판 이름을 입력하세요:');
    if (!name || !name.trim()) return;

    try {
      const response = await fetch('/api/boards/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        alert('게시판 추가에 실패했습니다.');
        return;
      }

      await loadBoards();
    } catch (error) {
      console.error('Failed to add board:', error);
      alert('게시판 추가 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateBoardName = async (id: number, currentName: string) => {
    const name = prompt('게시판 이름을 입력하세요:', currentName);
    if (!name || !name.trim() || name.trim() === currentName) return;

    try {
      const response = await fetch('/api/boards/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: name.trim() }),
      });

      if (!response.ok) {
        alert('게시판 이름 변경에 실패했습니다.');
        return;
      }

      await loadBoards();
    } catch (error) {
      console.error('Failed to update board name:', error);
      alert('게시판 이름 변경 중 오류가 발생했습니다.');
    }
  };

  const handleMoveBoardUp = async (index: number) => {
    if (index === 0) return;

    const current = boards[index];
    const above = boards[index - 1];

    try {
      await Promise.all([
        fetch('/api/boards/manage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: current.id, order: above.order }),
        }),
        fetch('/api/boards/manage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: above.id, order: current.order }),
        }),
      ]);

      await loadBoards();
    } catch (error) {
      console.error('Failed to move board:', error);
      alert('게시판 순서 변경 중 오류가 발생했습니다.');
    }
  };

  const handleMoveBoardDown = async (index: number) => {
    if (index === boards.length - 1) return;

    const current = boards[index];
    const below = boards[index + 1];

    try {
      await Promise.all([
        fetch('/api/boards/manage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: current.id, order: below.order }),
        }),
        fetch('/api/boards/manage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: below.id, order: current.order }),
        }),
      ]);

      await loadBoards();
    } catch (error) {
      console.error('Failed to move board:', error);
      alert('게시판 순서 변경 중 오류가 발생했습니다.');
    }
  };

  const handleAddSubBoard = async (boardId: number) => {
    const name = prompt('서브게시판 이름을 입력하세요:');
    if (!name || !name.trim()) return;

    try {
      const response = await fetch('/api/sub-boards/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, name: name.trim() }),
      });

      if (!response.ok) {
        alert('서브게시판 추가에 실패했습니다.');
        return;
      }

      await loadSubBoards(boardId);
    } catch (error) {
      console.error('Failed to add sub-board:', error);
      alert('서브게시판 추가 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateSubBoardName = async (id: number, boardId: number, currentName: string) => {
    const name = prompt('서브게시판 이름을 입력하세요:', currentName);
    if (!name || !name.trim() || name.trim() === currentName) return;

    try {
      const response = await fetch('/api/sub-boards/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: name.trim() }),
      });

      if (!response.ok) {
        alert('서브게시판 이름 변경에 실패했습니다.');
        return;
      }

      await loadSubBoards(boardId);
    } catch (error) {
      console.error('Failed to update sub-board name:', error);
      alert('서브게시판 이름 변경 중 오류가 발생했습니다.');
    }
  };

  const handleMoveSubBoardUp = async (boardId: number, index: number) => {
    const subs = subBoards[boardId];
    if (!subs || index === 0) return;

    const current = subs[index];
    const above = subs[index - 1];

    try {
      await Promise.all([
        fetch('/api/sub-boards/manage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: current.id, order: above.order }),
        }),
        fetch('/api/sub-boards/manage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: above.id, order: current.order }),
        }),
      ]);

      await loadSubBoards(boardId);
    } catch (error) {
      console.error('Failed to move sub-board:', error);
      alert('서브게시판 순서 변경 중 오류가 발생했습니다.');
    }
  };

  const handleMoveSubBoardDown = async (boardId: number, index: number) => {
    const subs = subBoards[boardId];
    if (!subs || index === subs.length - 1) return;

    const current = subs[index];
    const below = subs[index + 1];

    try {
      await Promise.all([
        fetch('/api/sub-boards/manage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: current.id, order: below.order }),
        }),
        fetch('/api/sub-boards/manage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: below.id, order: current.order }),
        }),
      ]);

      await loadSubBoards(boardId);
    } catch (error) {
      console.error('Failed to move sub-board:', error);
      alert('서브게시판 순서 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <AdminLayout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">게시판 설정</h1>
          <button onClick={handleAddBoard} className="px-3 py-1 bg-blue-600 text-white">
            + 게시판 추가
          </button>
        </div>

        <div>
          {boards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              게시판이 없습니다. 게시판을 추가해주세요.
            </div>
          ) : (
            boards.map((board, boardIndex) => (
              <div key={board.id} className="border mb-3">
                <div className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleBoard(board.id)}>
                      {expandedBoards[board.id] ? '▼' : '▶'}
                    </button>
                    <span className="font-semibold">{board.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleUpdateBoardName(board.id, board.name)} className="px-2 py-1 text-sm bg-blue-100">수정</button>
                    <button onClick={() => handleMoveBoardUp(boardIndex)} disabled={boardIndex === 0} className="px-2 py-1 text-sm bg-gray-100 disabled:opacity-50">↑</button>
                    <button onClick={() => handleMoveBoardDown(boardIndex)} disabled={boardIndex === boards.length - 1} className="px-2 py-1 text-sm bg-gray-100 disabled:opacity-50">↓</button>
                    <button onClick={() => handleAddSubBoard(board.id)} className="px-2 py-1 text-sm bg-green-600 text-white">+ 서브</button>
                  </div>
                </div>

                {expandedBoards[board.id] && subBoards[board.id] && (
                  <div className="p-2">
                    {subBoards[board.id].length === 0 ? (
                      <div className="text-center py-4 text-gray-500">서브게시판이 없습니다.</div>
                    ) : (
                      <div>
                        {subBoards[board.id].map((subBoard, subIndex) => (
                          <div key={subBoard.id} className="flex items-center justify-between p-2 bg-gray-50 mb-1">
                            <span>{subBoard.name}</span>
                            <div className="flex gap-1">
                              <button onClick={() => handleUpdateSubBoardName(subBoard.id, board.id, subBoard.name)} className="px-2 py-1 text-sm bg-blue-100">수정</button>
                              <button onClick={() => handleMoveSubBoardUp(board.id, subIndex)} disabled={subIndex === 0} className="px-2 py-1 text-sm bg-gray-200 disabled:opacity-50">↑</button>
                              <button onClick={() => handleMoveSubBoardDown(board.id, subIndex)} disabled={subIndex === subBoards[board.id].length - 1} className="px-2 py-1 text-sm bg-gray-200 disabled:opacity-50">↓</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
