import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getSubBoardById, updateSubBoardName } from '@/lib/db/queries';

// GET /admin/sub-boards/[subBoardId] - 하위 게시판 단건 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subBoardId: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { subBoardId: subBoardIdParam } = await params;
    const subBoardId = parseInt(subBoardIdParam);
    if (isNaN(subBoardId)) {
      return notFoundResponse('잘못된 하위 게시판 ID입니다');
    }

    const subBoard = await getSubBoardById(subBoardId);
    if (!subBoard) {
      return notFoundResponse('하위 게시판을 찾을 수 없습니다');
    }

    return successResponse(subBoard);
  } catch (error) {
    console.error('Get sub-board error:', error);
    return serverErrorResponse('하위 게시판 조회에 실패했습니다');
  }
}

// PATCH /admin/sub-boards/[subBoardId] - 하위 게시판 이름 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subBoardId: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { subBoardId: subBoardIdParam } = await params;
    const subBoardId = parseInt(subBoardIdParam);
    if (isNaN(subBoardId)) {
      return errorResponse('잘못된 하위 게시판 ID입니다');
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return errorResponse('하위 게시판 이름을 입력해주세요');
    }

    await updateSubBoardName(subBoardId, name.trim());
    return successResponse({ message: '하위 게시판 이름이 수정되었습니다' });
  } catch (error) {
    console.error('Update sub-board name error:', error);
    return serverErrorResponse('하위 게시판 이름 수정에 실패했습니다');
  }
}
