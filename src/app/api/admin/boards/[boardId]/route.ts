import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getBoardById, updateBoardName } from '@/lib/db/queries';

// GET /admin/boards/[boardId] - 게시판 단건 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { boardId: boardIdParam } = await params;
    const boardId = parseInt(boardIdParam);
    if (isNaN(boardId)) {
      return notFoundResponse('잘못된 게시판 ID입니다');
    }

    const board = await getBoardById(boardId);
    if (!board) {
      return notFoundResponse('게시판을 찾을 수 없습니다');
    }

    return successResponse(board);
  } catch (error) {
    console.error('Get board error:', error);
    return serverErrorResponse('게시판 조회에 실패했습니다');
  }
}

// PATCH /admin/boards/[boardId] - 게시판 이름 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { boardId: boardIdParam } = await params;
    const boardId = parseInt(boardIdParam);
    if (isNaN(boardId)) {
      return errorResponse('잘못된 게시판 ID입니다');
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return errorResponse('게시판 이름을 입력해주세요');
    }

    await updateBoardName(boardId, name.trim());
    return successResponse({ message: '게시판 이름이 수정되었습니다' });
  } catch (error) {
    console.error('Update board name error:', error);
    return serverErrorResponse('게시판 이름 수정에 실패했습니다');
  }
}
