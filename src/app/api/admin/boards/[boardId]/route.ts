import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { updateBoardName } from '@/lib/db/queries';

// PATCH /admin/boards/[boardId] - 게시판 이름 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const boardId = parseInt(params.boardId);
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
