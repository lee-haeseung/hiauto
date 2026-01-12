import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { getAllBoards, createBoard, updateBoardName, updateBoardOrder } from '@/lib/db/queries';

// GET /admin/boards - 게시판 목록 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const boards = await getAllBoards();
    return successResponse(boards);
  } catch (error) {
    console.error('Get boards error:', error);
    return serverErrorResponse('게시판 목록 조회에 실패했습니다');
  }
}

// POST /admin/boards - 게시판 생성
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return errorResponse('게시판 이름을 입력해주세요');
    }

    const board = await createBoard(name.trim());
    return successResponse(board, 201);
  } catch (error) {
    console.error('Create board error:', error);
    return serverErrorResponse('게시판 생성에 실패했습니다');
  }
}

// PATCH /admin/boards - 게시판 순서 수정
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { boards } = await request.json();

    if (!Array.isArray(boards)) {
      return errorResponse('잘못된 요청 형식입니다');
    }

    // 순서 업데이트
    for (const board of boards) {
      if (board.id && board.order !== undefined) {
        await updateBoardOrder(board.id, board.order);
      }
    }

    return successResponse({ message: '게시판 순서가 변경되었습니다' });
  } catch (error) {
    console.error('Update board order error:', error);
    return serverErrorResponse('게시판 순서 변경에 실패했습니다');
  }
}
