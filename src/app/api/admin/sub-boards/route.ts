import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { getAllSubBoards, createSubBoard, updateSubBoardOrder } from '@/lib/db/queries';

// GET /admin/sub-boards - 하위 게시판 목록 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    const subBoards = await getAllSubBoards(boardId ? Number(boardId) : undefined);
    return successResponse(subBoards);
  } catch (error) {
    console.error('Get sub-boards error:', error);
    return serverErrorResponse('하위 게시판 목록 조회에 실패했습니다');
  }
}

// POST /admin/sub-boards - 하위 게시판 생성
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { boardId, name } = await request.json();

    if (!boardId || !name || !name.trim()) {
      return errorResponse('게시판 ID와 이름을 입력해주세요');
    }

    const subBoard = await createSubBoard(boardId, name.trim());
    return successResponse(subBoard, 201);
  } catch (error) {
    console.error('Create sub-board error:', error);
    return serverErrorResponse('하위 게시판 생성에 실패했습니다');
  }
}

// PATCH /admin/sub-boards - 하위 게시판 순서 수정
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { subBoards } = await request.json();

    if (!Array.isArray(subBoards)) {
      return errorResponse('잘못된 요청 형식입니다');
    }

    // 순서 업데이트
    for (const subBoard of subBoards) {
      if (subBoard.id && subBoard.order !== undefined) {
        await updateSubBoardOrder(subBoard.id, subBoard.order);
      }
    }

    return successResponse({ message: '하위 게시판 순서가 변경되었습니다' });
  } catch (error) {
    console.error('Update sub-board order error:', error);
    return serverErrorResponse('하위 게시판 순서 변경에 실패했습니다');
  }
}
